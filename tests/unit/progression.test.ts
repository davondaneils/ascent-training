import { describe, expect, it } from "vitest";
import {
  getAssistanceProgressionNextWeight,
  getDoubleProgressionNextWeight,
  getNextPrescription,
  getPreviousExercisePerformance,
} from "@/lib/progression";
import { referenceWeight } from "@/lib/progression/reference";
import { PHASE_1 } from "@/lib/training/programs/phase-1";
import type { ExercisePerformance, LoggedSet, Prescription } from "@/lib/training/types";

const sets = (weight: number | null, ...reps: number[]): LoggedSet[] =>
  reps.map((r, i) => ({ setNumber: i + 1, weight, reps: r }));

const exercise = (slug: string) => PHASE_1.exercises.find((e) => e.slug === slug)!;
const prescription = (key: string): Prescription =>
  PHASE_1.days.flatMap((d) => d.prescriptions).find((p) => p.key === key)!;

function perf(
  prescriptionKey: string,
  exerciseSlug: string,
  date: string,
  s: LoggedSet[],
  extra: Partial<ExercisePerformance> = {},
): ExercisePerformance {
  return { workoutId: `w-${date}`, date, weekNumber: 1, isDeload: false, prescriptionKey, exerciseSlug, sets: s, ...extra };
}

describe("double progression (acceptance: bench 4 × 4–6, +5 lb)", () => {
  const bench = { targetSets: 4, repMax: 6, increment: 5 };

  it("185 × 6/6/6/6 → 190 lb", () => {
    expect(getDoubleProgressionNextWeight({ ...bench, previousSets: sets(185, 6, 6, 6, 6) })).toEqual({
      weight: 190,
      progressed: true,
    });
  });

  it("185 × 6/6/5/5 → stays 185 lb", () => {
    expect(getDoubleProgressionNextWeight({ ...bench, previousSets: sets(185, 6, 6, 5, 5) })).toEqual({
      weight: 185,
      progressed: false,
    });
  });

  it("an incomplete session (3 of 4 sets) does not progress", () => {
    expect(getDoubleProgressionNextWeight({ ...bench, previousSets: sets(185, 6, 6, 6) }).weight).toBe(185);
  });

  it("an extra set beyond the prescription does not block progression", () => {
    expect(getDoubleProgressionNextWeight({ ...bench, previousSets: sets(185, 6, 6, 6, 6, 4) }).weight).toBe(190);
  });

  it("sets at a lighter weight don't count toward the criterion", () => {
    const mixed: LoggedSet[] = [...sets(185, 6, 6, 6), { setNumber: 4, weight: 175, reps: 6 }];
    expect(getDoubleProgressionNextWeight({ ...bench, previousSets: mixed })).toEqual({ weight: 185, progressed: false });
  });

  it("no recorded weight → no recommendation", () => {
    expect(getDoubleProgressionNextWeight({ ...bench, previousSets: sets(null, 6, 6, 6, 6) }).weight).toBeNull();
  });
});

describe("reference weight", () => {
  it("is the most-used weight", () => {
    expect(referenceWeight([...sets(185, 6, 6), { setNumber: 3, weight: 180, reps: 6 }], "higher_is_harder")).toBe(185);
  });

  it("breaks ties toward the harder weight in each direction", () => {
    const tie: LoggedSet[] = [
      { setNumber: 1, weight: 40, reps: 8 },
      { setNumber: 2, weight: 30, reps: 8 },
    ];
    expect(referenceWeight(tie, "higher_is_harder")).toBe(40);
    expect(referenceWeight(tie, "lower_is_harder")).toBe(30);
  });

  it("ignores sets with no reps", () => {
    expect(referenceWeight([{ setNumber: 1, weight: 200, reps: null }, ...sets(185, 5)], "higher_is_harder")).toBe(185);
  });
});

describe("assistance reduction (acceptance)", () => {
  const pullUp = { targetSets: 4, repMax: 8, increment: 5 };

  it("all sets at top of range → less assistance", () => {
    expect(getAssistanceProgressionNextWeight({ ...pullUp, previousSets: sets(40, 8, 8, 8, 8) })).toEqual({
      weight: 35,
      progressed: true,
    });
  });

  it("understands lower assistance is harder: sets at more assistance don't qualify", () => {
    const mixed: LoggedSet[] = [...sets(40, 8, 8, 8), { setNumber: 4, weight: 50, reps: 8 }];
    expect(getAssistanceProgressionNextWeight({ ...pullUp, previousSets: mixed })).toEqual({ weight: 40, progressed: false });
  });

  it("sets at less assistance than the reference still qualify", () => {
    const mixed: LoggedSet[] = [...sets(40, 8, 8, 8), { setNumber: 4, weight: 35, reps: 8 }];
    expect(getAssistanceProgressionNextWeight({ ...pullUp, previousSets: mixed }).weight).toBe(35);
  });

  it("never goes below 0", () => {
    expect(getAssistanceProgressionNextWeight({ ...pullUp, previousSets: sets(5, 8, 8, 8, 8) }).weight).toBe(0);
    expect(getAssistanceProgressionNextWeight({ ...pullUp, previousSets: sets(3, 8, 8, 8, 8) }).weight).toBe(0);
  });

  it("missing reps keeps the same assistance", () => {
    expect(getAssistanceProgressionNextWeight({ ...pullUp, previousSets: sets(40, 8, 8, 7, 6) }).weight).toBe(40);
  });
});

describe("getNextPrescription", () => {
  const bench = prescription("mon-bench-press");
  const benchEx = exercise("bench-press");

  it("first-ever exposure", () => {
    const r = getNextPrescription({ exercise: benchEx, prescription: bench, history: [], isDeloadWeek: false });
    expect(r.kind).toBe("first_session");
    expect(r.recommendedWeight).toBeNull();
  });

  it("explains an increase", () => {
    const history = [perf("mon-bench-press", "bench-press", "2026-10-05", sets(185, 6, 6, 6, 6))];
    const r = getNextPrescription({ exercise: benchEx, prescription: bench, history, isDeloadWeek: false });
    expect(r).toMatchObject({ kind: "increase", recommendedWeight: 190, reason: "Up 5 lb — all sets reached 6" });
  });

  it("explains holding the load", () => {
    const history = [perf("mon-bench-press", "bench-press", "2026-10-05", sets(185, 6, 6, 5, 5))];
    const r = getNextPrescription({ exercise: benchEx, prescription: bench, history, isDeloadWeek: false });
    expect(r).toMatchObject({ kind: "same", recommendedWeight: 185, reason: "Same load — beat last performance" });
  });

  it("uses the most recent non-deload session", () => {
    const history = [
      perf("mon-bench-press", "bench-press", "2026-10-19", sets(185, 6, 6, 6, 6)),
      perf("mon-bench-press", "bench-press", "2026-10-26", sets(165, 6, 6), { isDeload: true, weekNumber: 4 }),
      perf("mon-bench-press", "bench-press", "2026-10-12", sets(180, 6, 6, 6, 6)),
    ];
    const r = getNextPrescription({ exercise: benchEx, prescription: bench, history, isDeloadWeek: false });
    expect(r.recommendedWeight).toBe(190);
    expect(r.source?.date).toBe("2026-10-19");
  });

  it("in a deload week recommends the last normal load without progressing", () => {
    const history = [perf("mon-bench-press", "bench-press", "2026-10-19", sets(185, 6, 6, 6, 6))];
    const r = getNextPrescription({ exercise: benchEx, prescription: bench, history, isDeloadWeek: true });
    expect(r).toMatchObject({ kind: "deload", recommendedWeight: 185 });
  });

  it("prefers the same weekday slot over another day's exposure", () => {
    const wed = prescription("wed-incline-db-press");
    const history = [
      perf("mon-incline-db-press", "incline-db-press", "2026-10-12", sets(60, 10, 10, 10)),
      perf("wed-incline-db-press", "incline-db-press", "2026-10-07", sets(50, 12, 12, 11)),
    ];
    const r = getNextPrescription({ exercise: exercise("incline-db-press"), prescription: wed, history, isDeloadWeek: false });
    expect(r.source?.prescriptionKey).toBe("wed-incline-db-press");
    expect(r.recommendedWeight).toBe(50);
  });

  it("falls back to the exercise's other slot, judged against today's rep range", () => {
    const wed = prescription("wed-incline-db-press"); // 3 × 8–12
    const history = [perf("mon-incline-db-press", "incline-db-press", "2026-10-05", sets(60, 10, 10, 10))];
    const r = getNextPrescription({ exercise: exercise("incline-db-press"), prescription: wed, history, isDeloadWeek: false });
    expect(r).toMatchObject({ kind: "same", recommendedWeight: 60 });
  });

  describe("assisted pull-up", () => {
    const pull = prescription("mon-pull-up");
    const pullEx = exercise("pull-up");

    it("reduces assistance with a clear reason", () => {
      const history = [perf("mon-pull-up", "pull-up", "2026-10-05", sets(40, 8, 8, 8, 8))];
      const r = getNextPrescription({ exercise: pullEx, prescription: pull, history, isDeloadWeek: false });
      expect(r).toMatchObject({ kind: "reduce_assistance", recommendedWeight: 35, reason: "5 lb less assistance — all sets reached 8" });
    });

    it("keeps assistance when not all sets reached the top", () => {
      const history = [perf("mon-pull-up", "pull-up", "2026-10-05", sets(40, 8, 8, 7, 6))];
      const r = getNextPrescription({ exercise: pullEx, prescription: pull, history, isDeloadWeek: false });
      expect(r).toMatchObject({ kind: "same_assistance", recommendedWeight: 40 });
    });

    it("reaching zero assistance", () => {
      const history = [perf("mon-pull-up", "pull-up", "2026-10-05", sets(5, 8, 8, 8, 8))];
      const r = getNextPrescription({ exercise: pullEx, prescription: pull, history, isDeloadWeek: false });
      expect(r).toMatchObject({ kind: "unassisted", recommendedWeight: 0 });
    });

    it("already unassisted → bodyweight reps", () => {
      const history = [perf("mon-pull-up", "pull-up", "2026-10-05", sets(0, 6, 6, 5, 5))];
      const r = getNextPrescription({ exercise: pullEx, prescription: pull, history, isDeloadWeek: false });
      expect(r).toMatchObject({ kind: "bodyweight", recommendedWeight: 0 });
    });
  });

  it("bodyweight movements get no load recommendation", () => {
    const deadBug = prescription("tue-dead-bug");
    const history = [perf("tue-dead-bug", "dead-bug", "2026-10-06", sets(null, 10, 10))];
    const r = getNextPrescription({ exercise: exercise("dead-bug"), prescription: deadBug, history, isDeloadWeek: false });
    expect(r).toMatchObject({ kind: "bodyweight", recommendedWeight: null });
  });

  it("timed holds have no progression", () => {
    const hang = prescription("fri-dead-hang");
    const r = getNextPrescription({ exercise: exercise("dead-hang"), prescription: hang, history: [], isDeloadWeek: false });
    expect(r.kind).toBe("none");
  });
});

describe("previous performance", () => {
  it("returns null for a first session", () => {
    expect(getPreviousExercisePerformance([], "mon-bench-press", "bench-press")).toBeNull();
  });

  it("shows the most recent exposure, deload included", () => {
    const history = [
      perf("mon-bench-press", "bench-press", "2026-10-19", sets(185, 6, 6, 6, 6)),
      perf("mon-bench-press", "bench-press", "2026-10-26", sets(165, 6, 6), { isDeload: true }),
    ];
    expect(getPreviousExercisePerformance(history, "mon-bench-press", "bench-press")?.date).toBe("2026-10-26");
  });

  it("skips sessions where nothing was completed", () => {
    const history = [
      perf("mon-bench-press", "bench-press", "2026-10-19", sets(185, 6, 6, 6, 6)),
      perf("mon-bench-press", "bench-press", "2026-10-26", [{ setNumber: 1, weight: 185, reps: null }]),
    ];
    expect(getPreviousExercisePerformance(history, "mon-bench-press", "bench-press")?.date).toBe("2026-10-19");
  });
});
