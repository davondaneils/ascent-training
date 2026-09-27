// Active-workout state machine. A pure reducer: the UI dispatches, persistence mirrors.
// Time-dependent view state (resting vs ready) is derived with `now`, never stored.

import {
  extendRest,
  isRestComplete,
  remainingMs,
  skipRest,
  startRest,
  type RestTimer,
} from "./rest-timer";

export interface SessionSet {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  completedAt: number; // epoch ms
}

export interface SessionExercise {
  /** workout_exercises.id */
  id: string;
  prescriptionKey: string;
  exerciseSlug: string;
  plannedOrder: number;
  /** Order in which the user actually started it; null until the first set. */
  actualOrder: number | null;
  targetSets: number;
  restSeconds: number | null;
  sets: SessionSet[];
  completedAt: number | null;
}

export type SessionStatus = "in_progress" | "completed" | "abandoned";

export interface WorkoutSession {
  workoutId: string;
  status: SessionStatus;
  startedAt: number;
  completedAt: number | null;
  /** Always in planned order. */
  exercises: SessionExercise[];
  currentExerciseId: string;
  rest: RestTimer | null;
}

export interface NewSessionExercise {
  id: string;
  prescriptionKey: string;
  exerciseSlug: string;
  targetSets: number;
  restSeconds: number | null;
}

export function createSession(input: {
  workoutId: string;
  now: number;
  exercises: NewSessionExercise[];
}): WorkoutSession {
  if (input.exercises.length === 0) throw new Error("A workout needs at least one exercise");
  return {
    workoutId: input.workoutId,
    status: "in_progress",
    startedAt: input.now,
    completedAt: null,
    exercises: input.exercises.map((e, i) => ({
      ...e,
      plannedOrder: i + 1,
      actualOrder: null,
      sets: [],
      completedAt: null,
    })),
    currentExerciseId: input.exercises[0].id,
    rest: null,
  };
}

export type SessionAction =
  | { type: "complete_set"; setId: string; weight: number | null; reps: number | null; now: number }
  | { type: "edit_set"; setId: string; weight: number | null; reps: number | null }
  | { type: "extend_rest"; now: number; seconds?: number }
  | { type: "skip_rest"; now: number }
  | { type: "continue" }
  | { type: "jump"; exerciseId: string }
  | { type: "finish"; now: number }
  | { type: "abandon"; now: number };

export function isExerciseComplete(ex: SessionExercise): boolean {
  return ex.sets.length >= ex.targetSets;
}

export function getCurrentExercise(s: WorkoutSession): SessionExercise {
  const ex = s.exercises.find((e) => e.id === s.currentExerciseId);
  if (!ex) throw new Error(`Unknown current exercise ${s.currentExerciseId}`);
  return ex;
}

/** The next incomplete exercise after the current one in planned order, wrapping to skipped ones. */
export function getNextIncompleteExercise(s: WorkoutSession): SessionExercise | null {
  const i = s.exercises.findIndex((e) => e.id === s.currentExerciseId);
  const n = s.exercises.length;
  for (let step = 1; step < n; step++) {
    const ex = s.exercises[(i + step) % n];
    if (!isExerciseComplete(ex)) return ex;
  }
  return null;
}

export function areAllExercisesComplete(s: WorkoutSession): boolean {
  return s.exercises.every(isExerciseComplete);
}

function replaceExercise(s: WorkoutSession, ex: SessionExercise): WorkoutSession {
  return { ...s, exercises: s.exercises.map((e) => (e.id === ex.id ? ex : e)) };
}

export function sessionReducer(s: WorkoutSession, action: SessionAction): WorkoutSession {
  if (s.status !== "in_progress") return s;

  switch (action.type) {
    case "complete_set": {
      const ex = getCurrentExercise(s);
      if (isExerciseComplete(ex)) return s;
      if (s.exercises.some((e) => e.sets.some((set) => set.id === action.setId))) return s;
      const actualOrder =
        ex.actualOrder ?? s.exercises.filter((e) => e.actualOrder !== null).length + 1;
      const sets = [
        ...ex.sets,
        {
          id: action.setId,
          setNumber: ex.sets.length + 1,
          weight: action.weight,
          reps: action.reps,
          completedAt: action.now,
        },
      ];
      const updated: SessionExercise = {
        ...ex,
        actualOrder,
        sets,
        completedAt: sets.length >= ex.targetSets ? action.now : null,
      };
      const next = replaceExercise(s, updated);
      // No rest after the final set of the whole workout, or when rest is "as needed".
      const rest =
        ex.restSeconds !== null && !areAllExercisesComplete(next)
          ? startRest(action.now, ex.restSeconds)
          : null;
      return { ...next, rest };
    }

    case "edit_set": {
      const ex = s.exercises.find((e) => e.sets.some((set) => set.id === action.setId));
      if (!ex) return s;
      return replaceExercise(s, {
        ...ex,
        sets: ex.sets.map((set) =>
          set.id === action.setId ? { ...set, weight: action.weight, reps: action.reps } : set,
        ),
      });
    }

    case "extend_rest":
      return s.rest ? { ...s, rest: extendRest(s.rest, action.now, action.seconds ?? 30) } : s;

    case "skip_rest":
      return s.rest ? { ...s, rest: skipRest(s.rest, action.now) } : s;

    case "continue": {
      const next = getNextIncompleteExercise(s);
      return next ? { ...s, currentExerciseId: next.id } : s;
    }

    case "jump":
      return s.exercises.some((e) => e.id === action.exerciseId)
        ? { ...s, currentExerciseId: action.exerciseId }
        : s;

    case "finish":
      return { ...s, status: "completed", completedAt: action.now, rest: null };

    case "abandon":
      return { ...s, status: "abandoned", completedAt: null, rest: null };
  }
}

// ---------------------------------------------------------------------------
// Derived views

export type SessionView =
  | { kind: "ready"; exercise: SessionExercise; setNumber: number }
  | { kind: "resting"; exercise: SessionExercise; setNumber: number; remainingMs: number }
  | {
      kind: "exercise_complete";
      exercise: SessionExercise;
      next: SessionExercise | null;
      /** Rest still counting down from the final set, if any. */
      remainingMs: number;
    }
  | { kind: "ended"; status: Exclude<SessionStatus, "in_progress"> };

export function getSessionView(s: WorkoutSession, now: number): SessionView {
  if (s.status !== "in_progress") return { kind: "ended", status: s.status };
  const exercise = getCurrentExercise(s);
  const restLeft = s.rest ? remainingMs(s.rest, now) : 0;
  if (isExerciseComplete(exercise)) {
    return { kind: "exercise_complete", exercise, next: getNextIncompleteExercise(s), remainingMs: restLeft };
  }
  const setNumber = exercise.sets.length + 1;
  if (s.rest && !isRestComplete(s.rest, now)) {
    return { kind: "resting", exercise, setNumber, remainingMs: restLeft };
  }
  return { kind: "ready", exercise, setNumber };
}

export type OverviewStatus = "complete" | "current" | "partial" | "not_started";

export interface OverviewRow {
  id: string;
  exerciseSlug: string;
  completedSets: number;
  targetSets: number;
  status: OverviewStatus;
  isCurrent: boolean;
}

export function getOverview(s: WorkoutSession): OverviewRow[] {
  return s.exercises.map((e) => {
    const isCurrent = e.id === s.currentExerciseId;
    const status: OverviewStatus = isExerciseComplete(e)
      ? "complete"
      : isCurrent
        ? "current"
        : e.sets.length > 0
          ? "partial"
          : "not_started";
    return { id: e.id, exerciseSlug: e.exerciseSlug, completedSets: e.sets.length, targetSets: e.targetSets, status, isCurrent };
  });
}

export interface SessionSummary {
  exercisesPerformed: number;
  workingSets: number;
  durationMinutes: number;
  exercises: { id: string; exerciseSlug: string; sets: SessionSet[] }[];
}

export function summarizeSession(s: WorkoutSession, now: number): SessionSummary {
  const performed = s.exercises.filter((e) => e.sets.length > 0);
  const end = s.completedAt ?? now;
  return {
    exercisesPerformed: performed.length,
    workingSets: performed.reduce((n, e) => n + e.sets.length, 0),
    durationMinutes: Math.max(0, Math.round((end - s.startedAt) / 60_000)),
    exercises: [...performed]
      .sort((a, b) => (a.actualOrder ?? 0) - (b.actualOrder ?? 0))
      .map((e) => ({ id: e.id, exerciseSlug: e.exerciseSlug, sets: e.sets })),
  };
}
