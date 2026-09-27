import { describe, expect, it } from "vitest";
import {
  createSession,
  getOverview,
  getSessionView,
  sessionReducer,
  summarizeSession,
  type SessionAction,
  type WorkoutSession,
} from "@/lib/training/session";

const T0 = 1_760_000_000_000;
const MIN = 60_000;

function newSession(): WorkoutSession {
  return createSession({
    workoutId: "w1",
    now: T0,
    exercises: [
      { id: "bench", prescriptionKey: "mon-bench-press", exerciseSlug: "bench-press", targetSets: 2, restSeconds: 180 },
      { id: "pull", prescriptionKey: "mon-pull-up", exerciseSlug: "pull-up", targetSets: 2, restSeconds: 120 },
      { id: "curl", prescriptionKey: "mon-incline-db-curl", exerciseSlug: "incline-db-curl", targetSets: 1, restSeconds: 60 },
    ],
  });
}

const run = (s: WorkoutSession, ...actions: SessionAction[]) => actions.reduce(sessionReducer, s);
let seq = 0;
const set = (now: number, weight: number | null = 185, reps: number | null = 6): SessionAction => ({
  type: "complete_set",
  setId: `set-${++seq}`,
  weight,
  reps,
  now,
});

describe("workout session", () => {
  it("starts on the first exercise, ready for set 1", () => {
    const view = getSessionView(newSession(), T0);
    expect(view).toMatchObject({ kind: "ready", setNumber: 1 });
    if (view.kind === "ready") expect(view.exercise.id).toBe("bench");
  });

  it("completing a set saves it and starts the prescribed rest", () => {
    const s = run(newSession(), set(T0 + MIN));
    expect(s.exercises[0].sets).toHaveLength(1);
    expect(s.exercises[0].sets[0]).toMatchObject({ setNumber: 1, weight: 185, reps: 6 });
    expect(s.rest).toEqual({ startedAt: T0 + MIN, endsAt: T0 + MIN + 180_000 });
    expect(getSessionView(s, T0 + MIN + 1_000)).toMatchObject({ kind: "resting", setNumber: 2, remainingMs: 179_000 });
  });

  it("rest ends → ready for the next set", () => {
    const s = run(newSession(), set(T0));
    expect(getSessionView(s, T0 + 180_000)).toMatchObject({ kind: "ready", setNumber: 2 });
  });

  it("+30 sec and skip act on the rest timer", () => {
    let s = run(newSession(), set(T0), { type: "extend_rest", now: T0 + 1_000 });
    expect(s.rest?.endsAt).toBe(T0 + 210_000);
    s = sessionReducer(s, { type: "skip_rest", now: T0 + 2_000 });
    expect(getSessionView(s, T0 + 2_000)).toMatchObject({ kind: "ready", setNumber: 2 });
  });

  it("after the last set, shows exercise complete with the next exercise", () => {
    const s = run(newSession(), set(T0), set(T0 + 4 * MIN));
    const view = getSessionView(s, T0 + 4 * MIN + 1_000);
    expect(view.kind).toBe("exercise_complete");
    if (view.kind === "exercise_complete") {
      expect(view.next?.id).toBe("pull");
      expect(view.remainingMs).toBe(179_000); // rest keeps counting on the completion card
    }
    expect(s.exercises[0].completedAt).toBe(T0 + 4 * MIN);
  });

  it("continue moves to the next exercise", () => {
    const s = run(newSession(), set(T0), set(T0 + MIN), { type: "continue" });
    expect(s.currentExerciseId).toBe("pull");
  });

  it("ignores sets beyond the prescription and duplicate set ids", () => {
    let s = run(newSession(), set(T0), set(T0 + MIN), set(T0 + 2 * MIN));
    expect(s.exercises[0].sets).toHaveLength(2);
    s = run(newSession(), { type: "complete_set", setId: "dup", weight: 1, reps: 1, now: T0 });
    s = sessionReducer(s, { type: "complete_set", setId: "dup", weight: 1, reps: 1, now: T0 + 1 });
    expect(s.exercises[0].sets).toHaveLength(1);
  });

  describe("overview and jumping", () => {
    it("lists all exercises with counts and the current one", () => {
      const s = run(newSession(), set(T0));
      expect(getOverview(s)).toEqual([
        { id: "bench", exerciseSlug: "bench-press", completedSets: 1, targetSets: 2, status: "current", isCurrent: true },
        { id: "pull", exerciseSlug: "pull-up", completedSets: 0, targetSets: 2, status: "not_started", isCurrent: false },
        { id: "curl", exerciseSlug: "incline-db-curl", completedSets: 0, targetSets: 1, status: "not_started", isCurrent: false },
      ]);
    });

    it("jumping keeps completed work and records actual order", () => {
      let s = run(newSession(), set(T0), { type: "jump", exerciseId: "curl" }, set(T0 + 3 * MIN, 30, 12));
      expect(s.exercises[0].sets).toHaveLength(1);
      expect(s.exercises.find((e) => e.id === "curl")?.actualOrder).toBe(2);
      // Continue from the jumped-to exercise wraps back to what's unfinished.
      s = sessionReducer(s, { type: "continue" });
      expect(s.currentExerciseId).toBe("bench");
      expect(getOverview(s).map((r) => r.status)).toEqual(["current", "not_started", "complete"]);
      s = run(s, set(T0 + 10 * MIN), { type: "continue" });
      expect(s.currentExerciseId).toBe("pull");
    });

    it("jumping to an unknown exercise is ignored", () => {
      const s = run(newSession(), { type: "jump", exerciseId: "nope" });
      expect(s.currentExerciseId).toBe("bench");
    });
  });

  it("editing a set changes only that set", () => {
    let s = run(newSession(), { type: "complete_set", setId: "a", weight: 815, reps: 6, now: T0 });
    s = sessionReducer(s, { type: "edit_set", setId: "a", weight: 185, reps: 6 });
    expect(s.exercises[0].sets[0]).toMatchObject({ id: "a", weight: 185, reps: 6, completedAt: T0 });
  });

  it("no rest after the final set of the workout", () => {
    const s = run(
      newSession(),
      set(T0), set(T0 + MIN), { type: "continue" },
      set(T0 + 2 * MIN), set(T0 + 3 * MIN), { type: "continue" },
      set(T0 + 4 * MIN),
    );
    expect(s.rest).toBeNull();
    const view = getSessionView(s, T0 + 4 * MIN);
    expect(view).toMatchObject({ kind: "exercise_complete", next: null });
  });

  it("exercises with rest 'as needed' don't start a timer", () => {
    const s = run(
      createSession({
        workoutId: "w",
        now: T0,
        exercises: [
          { id: "hang", prescriptionKey: "fri-dead-hang", exerciseSlug: "dead-hang", targetSets: 2, restSeconds: null },
          { id: "x", prescriptionKey: "x", exerciseSlug: "x", targetSets: 1, restSeconds: 60 },
        ],
      }),
      set(T0, null, null),
    );
    expect(s.rest).toBeNull();
    expect(getSessionView(s, T0)).toMatchObject({ kind: "ready", setNumber: 2 });
  });

  it("finish stores completion time and freezes the session", () => {
    let s = run(newSession(), set(T0), { type: "finish", now: T0 + 58 * MIN });
    expect(s).toMatchObject({ status: "completed", completedAt: T0 + 58 * MIN, rest: null });
    expect(getSessionView(s, T0 + 60 * MIN)).toEqual({ kind: "ended", status: "completed" });
    s = sessionReducer(s, set(T0 + 59 * MIN));
    expect(s.exercises[0].sets).toHaveLength(1);
  });

  it("abandon", () => {
    const s = run(newSession(), { type: "abandon", now: T0 + MIN });
    expect(s.status).toBe("abandoned");
  });

  it("summary counts exercises, working sets and duration", () => {
    const s = run(
      newSession(),
      set(T0 + MIN), set(T0 + 5 * MIN), { type: "continue" },
      set(T0 + 10 * MIN, 0, 8),
      { type: "finish", now: T0 + 58 * MIN },
    );
    const summary = summarizeSession(s, T0 + 99 * MIN);
    expect(summary).toMatchObject({ exercisesPerformed: 2, workingSets: 3, durationMinutes: 58 });
    expect(summary.exercises.map((e) => e.exerciseSlug)).toEqual(["bench-press", "pull-up"]);
  });

  it("requires at least one exercise", () => {
    expect(() => createSession({ workoutId: "w", now: T0, exercises: [] })).toThrow();
  });
});
