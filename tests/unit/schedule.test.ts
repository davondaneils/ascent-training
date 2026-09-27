import { describe, expect, it } from "vitest";
import { addDays, dayOfWeek, daysBetween, nextMonday, startOfWeek, toLocalDate } from "@/lib/dates";
import { deloadMinutes, deloadSets } from "@/lib/training/deload";
import {
  formatMinutes,
  formatPrescription,
  formatRest,
  formatSet,
  formatSetsCompact,
  weightLabel,
} from "@/lib/training/format";
import { PHASE_1 } from "@/lib/training/programs/phase-1";
import {
  estimateDurationMinutes,
  getCardio,
  programPosition,
  programWeek,
  resolveDay,
  resolveToday,
  scheduledCounts,
} from "@/lib/training/schedule";

const START = "2026-10-05"; // a Monday
const enrollment = { programBlockSlug: PHASE_1.slug, startDate: START };

describe("civil dates", () => {
  it("uses the Toronto calendar day, not UTC", () => {
    // 23:30 EDT on Monday Oct 5 is already Tuesday in UTC.
    expect(toLocalDate(new Date("2026-10-06T03:30:00Z"))).toBe("2026-10-05");
    expect(toLocalDate(new Date("2026-10-06T04:30:00Z"))).toBe("2026-10-06");
  });

  it("handles the DST change without skipping a day", () => {
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2);
    expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
  });

  it("Monday = 1 … Sunday = 7", () => {
    expect(dayOfWeek("2026-10-05")).toBe(1);
    expect(dayOfWeek("2026-10-10")).toBe(6);
    expect(dayOfWeek("2026-10-11")).toBe(7);
  });

  it("next Monday defaults", () => {
    expect(nextMonday("2026-09-27")).toBe("2026-09-28"); // Sunday → tomorrow
    expect(nextMonday("2026-10-05")).toBe("2026-10-05"); // Monday → today
    expect(nextMonday("2026-10-06")).toBe("2026-10-12"); // Tuesday → following Monday
  });

  it("start of week is Monday", () => {
    expect(startOfWeek("2026-10-11")).toBe("2026-10-05");
    expect(startOfWeek("2026-10-05")).toBe("2026-10-05");
  });

  it("rejects malformed dates", () => {
    expect(() => dayOfWeek("2026-02-30")).toThrow();
    expect(() => dayOfWeek("10/05/2026")).toThrow();
  });
});

describe("program week", () => {
  it("floor(days / 7) + 1 from the start date", () => {
    expect(programWeek(START, "2026-10-05", 12)).toBe(1);
    expect(programWeek(START, "2026-10-11", 12)).toBe(1); // Sunday stays in the same week
    expect(programWeek(START, "2026-10-12", 12)).toBe(2);
    expect(programWeek(START, "2026-12-27", 12)).toBe(12); // last day of week 12
  });

  it("clamps to the block length", () => {
    expect(programWeek(START, "2026-12-28", 12)).toBe(12);
    expect(programWeek(START, "2027-06-01", 12)).toBe(12);
  });

  it("works from a mid-week start date", () => {
    expect(programWeek("2026-10-07", "2026-10-13", 12)).toBe(1);
    expect(programWeek("2026-10-07", "2026-10-14", 12)).toBe(2);
  });

  it("before the start date there is no program week", () => {
    expect(programPosition(PHASE_1, enrollment, "2026-09-30")).toEqual({
      status: "before_start",
      startDate: START,
      daysUntilStart: 5,
    });
  });

  it("flags deload weeks 4, 8, 12", () => {
    const deloads = Array.from({ length: 12 }, (_, i) => i + 1).filter((w) => {
      const pos = programPosition(PHASE_1, enrollment, addDays(START, (w - 1) * 7));
      return pos.status === "active" && pos.isDeload;
    });
    expect(deloads).toEqual([4, 8, 12]);
  });
});

describe("day selection (acceptance labels)", () => {
  const names: [string, string][] = [
    ["2026-10-05", "Upper Strength"],
    ["2026-10-06", "Lower Strength + Movement"],
    ["2026-10-07", "Upper Hypertrophy"],
    ["2026-10-08", "Lower Hypertrophy"],
    ["2026-10-09", "Upper Specialization"],
    ["2026-10-10", "Aerobic + Mobility"],
    ["2026-10-11", "Rest · Fast"],
  ];

  it.each(names)("%s → %s", (date, name) => {
    expect(resolveDay(PHASE_1, 1, date).day.name).toBe(name);
  });

  it("Sunday is a true rest day: no exercises, no cardio", () => {
    const sunday = resolveDay(PHASE_1, 5, "2026-11-08");
    expect(sunday.day.sessionType).toBe("rest");
    expect(sunday.exercises).toHaveLength(0);
    expect(sunday.mobility).toHaveLength(0);
    expect(sunday.cardio).toBeNull();
  });

  it("Saturday has cardio and the mobility checklist, no lifting", () => {
    const sat = resolveDay(PHASE_1, 1, "2026-10-10");
    expect(sat.exercises).toHaveLength(0);
    expect(sat.mobility).toHaveLength(8);
    expect(sat.cardio?.targetMinutes).toBe(30);
  });

  it("resolves today in Toronto time", () => {
    // Monday 23:30 local, already Tuesday in UTC.
    const r = resolveToday(PHASE_1, enrollment, new Date("2026-10-13T03:30:00Z"));
    expect(r.status).toBe("active");
    if (r.status === "active") {
      expect(r.resolved.day.name).toBe("Upper Strength");
      expect(r.resolved.week).toBe(2);
    }
  });

  it("before the start date Today has no workout", () => {
    expect(resolveToday(PHASE_1, enrollment, new Date("2026-09-30T15:00:00Z")).status).toBe("before_start");
  });

  it("prescriptions come back in prescribed order", () => {
    const mon = resolveDay(PHASE_1, 1, "2026-10-05");
    expect(mon.exercises.map((p) => p.exerciseSlug)).toEqual([
      "bench-press",
      "pull-up",
      "incline-db-press",
      "chest-supported-row",
      "lateral-raise",
      "overhead-cable-triceps-extension",
      "incline-db-curl",
    ]);
  });

  it("separates prep from the logged exercises", () => {
    const tue = resolveDay(PHASE_1, 1, "2026-10-06");
    expect(tue.prep.map((p) => p.exerciseSlug)).toEqual([
      "knee-to-wall",
      "supported-deep-squat",
      "90-90-hip-switch",
      "adductor-rockback",
    ]);
    expect(tue.exercises).toHaveLength(7);
    expect(resolveDay(PHASE_1, 1, "2026-10-09").prep.map((p) => p.exerciseSlug)).toEqual(["scapular-pull-up"]);
  });
});

describe("deload", () => {
  it("working sets drop to ~55%", () => {
    expect([4, 3, 2, 1].map(deloadSets)).toEqual([2, 2, 1, 1]);
  });

  it("applies to logged exercises in deload weeks only", () => {
    const normal = resolveDay(PHASE_1, 3, "2026-10-19");
    const deload = resolveDay(PHASE_1, 4, "2026-10-26");
    expect(normal.exercises[0].sets).toBe(4);
    expect(deload.isDeload).toBe(true);
    expect(deload.exercises.map((p) => p.sets)).toEqual([2, 2, 2, 2, 2, 1, 1]);
  });

  it("leaves prep and mobility checklists unchanged", () => {
    const tue = resolveDay(PHASE_1, 4, "2026-10-27");
    expect(tue.prep.map((p) => p.sets)).toEqual([1, 2, 1, 1]);
    const sat = resolveDay(PHASE_1, 4, "2026-10-31");
    expect(sat.mobility.every((p) => p.sets === 2)).toBe(true);
  });

  it("cardio drops ~35%, rounded to 5 min", () => {
    expect([15, 20, 30, 40, 60, 75].map(deloadMinutes)).toEqual([10, 15, 20, 25, 40, 50]);
    expect(deloadMinutes(5)).toBe(5);
  });
});

describe("cardio ramp", () => {
  const minutes = (week: number, dow: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    const c = getCardio(PHASE_1, week, dow);
    return c ? [c.targetMinutes, c.targetMinutesMax] : null;
  };

  it("weeks 1–2: Mon 15, Wed 20, Fri 15–20, Sat 30; none Tue/Thu", () => {
    for (const w of [1, 2]) {
      expect(minutes(w, 1)).toEqual([15, null]);
      expect(minutes(w, 2)).toBeNull();
      expect(minutes(w, 3)).toEqual([20, null]);
      expect(minutes(w, 4)).toBeNull();
      expect(minutes(w, 5)).toEqual([15, 20]);
      expect(minutes(w, 6)).toEqual([30, null]);
    }
  });

  it("Tuesday cardio starts in week 3, Thursday in week 5", () => {
    expect(minutes(3, 2)).toEqual([15, null]);
    expect(minutes(3, 4)).toBeNull();
    expect(minutes(5, 4)).toEqual([15, 20]);
  });

  it("weeks 9–11 peak: Saturday 60–75", () => {
    for (const w of [9, 10, 11]) expect(minutes(w, 6)).toEqual([60, 75]);
  });

  it("deload weeks are reduced from the preceding block", () => {
    expect(minutes(4, 1)).toEqual([15, null]); // 20 → 15
    expect(minutes(4, 6)).toEqual([25, null]); // 35–40 → 25
    expect(minutes(8, 6)).toEqual([30, 40]); // 45–60 → 30–40
    expect(minutes(12, 6)).toEqual([40, 50]); // 60–75 → 40–50
  });

  it("never on Sunday; always easy RPE 2–3", () => {
    expect(PHASE_1.cardio.some((c) => c.dayOfWeek === 7)).toBe(false);
    expect(PHASE_1.cardio.every((c) => c.targetRpeMin === 2 && c.targetRpeMax === 3)).toBe(true);
    expect(new Set(PHASE_1.cardio.map((c) => c.weekNumber))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
  });

  it("weekly scheduled counts", () => {
    expect(scheduledCounts(PHASE_1, 1)).toEqual({ lifting: 5, cardio: 4 });
    expect(scheduledCounts(PHASE_1, 3)).toEqual({ lifting: 5, cardio: 5 });
    expect(scheduledCounts(PHASE_1, 5)).toEqual({ lifting: 5, cardio: 6 });
  });
});

describe("duration estimate", () => {
  it("gives a plausible Monday length", () => {
    const mins = estimateDurationMinutes(resolveDay(PHASE_1, 1, "2026-10-05"));
    expect(mins).toBeGreaterThanOrEqual(50);
    expect(mins).toBeLessThanOrEqual(75);
    expect(mins % 5).toBe(0);
  });

  it("is shorter in a deload week", () => {
    const normal = estimateDurationMinutes(resolveDay(PHASE_1, 3, "2026-10-19"));
    const deload = estimateDurationMinutes(resolveDay(PHASE_1, 4, "2026-10-26"));
    expect(deload).toBeLessThan(normal);
  });
});

describe("formatting", () => {
  const p = (key: string) => PHASE_1.days.flatMap((d) => d.prescriptions).find((x) => x.key === key)!;

  it("prescriptions", () => {
    expect(formatPrescription(p("mon-bench-press"))).toBe("4 × 4–6");
    expect(formatPrescription(p("tue-reverse-lunge"))).toBe("2 × 8–10/side");
    expect(formatPrescription(p("tue-prep-knee-to-wall"))).toBe("1–2 × 8/side");
    expect(formatPrescription(p("fri-dead-hang"))).toBe("2 × 20–40 sec");
    expect(formatPrescription(p("sat-split-stance-hold"))).toBe("2 × 20–30 sec/side");
  });

  it("rest, sets, minutes", () => {
    expect(formatRest(180)).toBe("3:00");
    expect(formatRest(90)).toBe("1:30");
    expect(formatSet({ weight: 185, reps: 6 }, "barbell")).toBe("185 × 6");
    expect(formatSet({ weight: 0, reps: 6 }, "assisted")).toBe("BW × 6");
    expect(formatSet({ weight: 40, reps: 8 }, "assisted")).toBe("−40 × 8");
    expect(formatSet({ weight: null, reps: 10 }, "bodyweight")).toBe("10 reps");
    expect(formatMinutes(15, 20)).toBe("15–20 min");
    expect(formatMinutes(30, null)).toBe("30 min");
  });
});

describe("date labels", () => {
  it("formats civil dates without time-zone drift", async () => {
    const { weekdayName, monthDay, shortWeekday } = await import("@/lib/dates");
    expect(weekdayName("2026-09-28")).toBe("Monday");
    expect(monthDay("2026-09-28")).toBe("September 28");
    expect(shortWeekday(7)).toBe("Sun");
  });
});

describe("program week range", () => {
  it("spans seven days from the start date", async () => {
    const { programWeekRange } = await import("@/lib/training/schedule");
    expect(programWeekRange("2026-10-05", 1)).toEqual({ from: "2026-10-05", to: "2026-10-11" });
    expect(programWeekRange("2026-10-05", 3)).toEqual({ from: "2026-10-19", to: "2026-10-25" });
  });
});

describe("compact set lines", () => {
  it("formats a session's sets", () => {
    const s = (weight: number | null, reps: number) => ({ weight, reps });
    expect(formatSetsCompact([s(185, 6), s(185, 6), s(185, 5), s(185, 5)], "barbell")).toBe("185 × 6 / 6 / 5 / 5");
    expect(formatSetsCompact([s(185, 6), s(180, 6)], "barbell")).toBe("185 × 6 · 180 × 6");
    expect(formatSetsCompact([s(null, 10), s(null, 9)], "bodyweight")).toBe("10 / 9 reps");
    expect(formatSetsCompact([s(40, 8), s(40, 7)], "assisted")).toBe("−40 × 8 / 7");
    expect(formatSetsCompact([s(0, 8), s(0, 7)], "assisted")).toBe("BW × 8 / 7");
    expect(formatSetsCompact([], "barbell")).toBe("");
    expect(weightLabel("assisted")).toBe("Assistance");
  });
});
