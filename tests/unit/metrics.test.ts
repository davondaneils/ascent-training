import { describe, expect, it } from "vitest";
import {
  carrySeries,
  consistency,
  loadSummary,
  packSeries,
  epley,
  longestSession,
  recentRpe,
  repsSeries,
  repsSummary,
  strengthSeries,
  strengthSummary,
  weeklyAerobicMinutes,
} from "@/lib/training/metrics";
import { PHASE_1 } from "@/lib/training/programs/phase-1";
import type { ExercisePerformance } from "@/lib/training/types";

const perf = (date: string, sets: [number | null, number][], extra: Partial<ExercisePerformance> = {}): ExercisePerformance => ({
  workoutId: date,
  date,
  weekNumber: 1,
  isDeload: false,
  prescriptionKey: "mon-bench-press",
  exerciseSlug: "bench-press",
  sets: sets.map(([weight, reps], i) => ({ setNumber: i + 1, weight, reps })),
  ...extra,
});

describe("strength", () => {
  it("takes the top set per session, oldest first", () => {
    const series = strengthSeries([
      perf("2026-10-12", [[190, 6], [190, 5]]),
      perf("2026-10-05", [[185, 6], [185, 6], [185, 6], [185, 6]]),
    ]);
    expect(series.map((p) => [p.date, p.topWeight, p.topReps])).toEqual([
      ["2026-10-05", 185, 6],
      ["2026-10-12", 190, 6],
    ]);
    expect(series[0].e1rm).toBeCloseTo(epley(185, 6));
  });

  it("merges two sessions on the same date (Monday bench + a same-day extra)", () => {
    const s = strengthSeries([perf("2026-10-05", [[185, 6]]), perf("2026-10-05", [[195, 3]], { prescriptionKey: "x" })]);
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ topWeight: 195, topReps: 3 });
  });

  it("summarises the trend in plain language", () => {
    expect(strengthSummary([])).toBeNull();
    expect(strengthSummary(strengthSeries([perf("2026-10-05", [[185, 6]])]))).toBe("First session logged");
    const up = strengthSeries([perf("2026-10-05", [[185, 6]]), perf("2026-11-30", [[195, 5]])]);
    expect(strengthSummary(up)).toBe("+10 lb over 8 weeks");
    const reps = strengthSeries([perf("2026-10-05", [[185, 4]]), perf("2026-10-19", [[185, 6]])]);
    expect(strengthSummary(reps)).toBe("+2 reps at 185 lb over 2 weeks");
  });

  it("ignores sets without weight or reps", () => {
    expect(strengthSeries([perf("2026-10-05", [[null, 6], [185, 0]])])).toEqual([]);
  });
});

describe("relative strength", () => {
  it("tracks best set, total reps and least assistance", () => {
    const s = repsSeries([perf("2026-10-05", [[40, 8], [40, 7], [30, 5]])]);
    expect(s[0]).toEqual({ date: "2026-10-05", bestReps: 8, totalReps: 20, assistance: 30 });
  });

  it("summarises assistance reduction and bodyweight progress", () => {
    expect(repsSummary(repsSeries([perf("2026-10-05", [[40, 8]]), perf("2026-11-02", [[25, 7]])]))).toBe(
      "Assistance 40 → 25 lb · best set 7",
    );
    expect(repsSummary(repsSeries([perf("2026-10-05", [[0, 4]]), perf("2026-11-02", [[0, 7]])]))).toBe(
      "+3 best-set reps · bodyweight",
    );
  });
});

describe("cardio", () => {
  const logs = [
    { date: "2026-09-28", actualMinutes: 15, rpe: 2 },
    { date: "2026-09-30", actualMinutes: 20, rpe: 3 },
    { date: "2026-10-03", actualMinutes: 31, rpe: 3 },
    { date: "2026-10-05", actualMinutes: 16, rpe: 4 },
    { date: "2026-09-01", actualMinutes: 99, rpe: 5 }, // before the block: ignored for weeks
  ];

  it("sums minutes per program week, zero-filling", () => {
    expect(weeklyAerobicMinutes(logs, PHASE_1, "2026-09-28", 3)).toEqual([
      { week: 1, minutes: 66, isDeload: false },
      { week: 2, minutes: 16, isDeload: false },
      { week: 3, minutes: 0, isDeload: false },
    ]);
  });

  it("shows only the latest 12 weeks, without merging later waves into week 12", () => {
    const logs = [
      { date: "2026-09-28", actualMinutes: 20, rpe: 2 },
      { date: "2026-12-21", actualMinutes: 60, rpe: 3 },
    ];
    const points = weeklyAerobicMinutes(logs, PHASE_1, "2026-09-28", 13);
    expect(points).toHaveLength(12);
    expect(points[0].week).toBe(2);
    expect(points[11]).toEqual({ week: 13, minutes: 60, isDeload: false });
  });
  it("finds the longest continuous session", () => {
    expect(longestSession(logs.slice(0, 4))).toEqual({ date: "2026-10-03", actualMinutes: 31, rpe: 3 });
    expect(longestSession([])).toBeNull();
  });

  it("recent RPE newest first", () => {
    expect(recentRpe(logs, 3)).toEqual([4, 3, 3]);
  });
});

describe("consistency", () => {
  it("counts to-date scheduled sessions and block completion", () => {
    // Start Mon 2026-09-28; today Wed of week 2 (day 10).
    const c = consistency({
      block: PHASE_1,
      startDate: "2026-09-28",
      today: "2026-10-07",
      completedLiftingDates: ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-02", "2026-10-05", "2026-10-05"],
      cardioDates: ["2026-09-28", "2026-10-03", "2026-10-03"],
    });
    // Lifting: week 1 Mon–Fri (5) + week 2 Mon–Wed (3) = 8. Cardio: week 1 Mon/Wed/Fri/Sat (4) + week 2 Mon/Wed (2) = 6.
    expect(c.lifting).toEqual({ done: 5, scheduled: 8 });
    expect(c.cardio).toEqual({ done: 2, scheduled: 6 });
    const total = 60 + PHASE_1.cardio.length;
    expect(c.blockPercent).toBe(Math.round((7 / total) * 100));
  });

  it("never counts sessions dated after today", () => {
    const c = consistency({
      block: PHASE_1,
      startDate: "2026-09-28",
      today: "2026-09-29",
      completedLiftingDates: ["2026-09-28", "2026-09-29", "2026-09-30"],
      cardioDates: ["2026-10-03"],
    });
    expect(c.lifting).toEqual({ done: 2, scheduled: 2 });
    expect(c.cardio.done).toBe(0);
  });

  it("counts the current training wave rather than accumulating only the first 12 weeks", () => {
    const c = consistency({
      block: PHASE_1, startDate: "2026-09-28", today: "2026-12-21",
      completedLiftingDates: ["2026-09-28", "2026-12-21"],
      cardioDates: ["2026-09-28", "2026-12-21"],
    });
    expect(c.lifting).toEqual({ done: 1, scheduled: 1 });
    expect(c.cardio).toEqual({ done: 1, scheduled: 1 });
  });
  it("is zero before the start date", () => {
    const c = consistency({ block: PHASE_1, startDate: "2026-09-28", today: "2026-09-27", completedLiftingDates: [], cardioDates: [] });
    expect(c.lifting.scheduled).toBe(0);
    expect(c.blockPercent).toBe(0);
  });
});

describe("carrying", () => {
  const carry = (date: string, weights: (number | null)[]): ExercisePerformance => ({
    workoutId: date, date, weekNumber: 1, isDeload: false, prescriptionKey: "readiness-x:1:carry", exerciseSlug: "farmer-carry",
    sets: weights.map((weight, i) => ({ setNumber: i + 1, weight, reps: null })),
  });

  it("charts the heaviest carry load per day and skips carries without a load", () => {
    const points = carrySeries([carry("2027-01-04", [30, 35]), carry("2027-01-01", [null, null]), carry("2027-02-01", [40, 40])]);
    expect(points).toEqual([{ date: "2027-01-04", load: 35 }, { date: "2027-02-01", load: 40 }]);
    expect(loadSummary(points, "lb")).toBe("35 → 40 lb over 4 weeks");
  });

  it("charts pack weight from loaded hikes only", () => {
    const logs = [
      { date: "2027-10-02", actualMinutes: 70, rpe: 3, modality: "loaded_hike" as const, packWeightKg: 3 },
      { date: "2027-10-05", actualMinutes: 35, rpe: 3, modality: "run" as const, packWeightKg: null },
      { date: "2027-10-09", actualMinutes: 75, rpe: 3, modality: "loaded_hike" as const, packWeightKg: null },
      { date: "2027-10-16", actualMinutes: 80, rpe: 3, modality: "loaded_hike" as const, packWeightKg: 3 },
      { date: "2027-10-01", actualMinutes: 30, rpe: 2 }, // older logs have neither field
    ];
    const points = packSeries(logs);
    expect(points).toEqual([{ date: "2027-10-02", load: 3 }, { date: "2027-10-16", load: 3 }]);
    expect(loadSummary(points, "kg")).toBe("Same load for 2 weeks");
    expect(loadSummary(points.slice(0, 1), "kg")).toBe("First load logged");
    expect(loadSummary([], "kg")).toBeNull();
  });
});
