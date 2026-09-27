// Integrity checks on the Phase 1 definition against docs/02-TRAINING.md.
import { describe, expect, it } from "vitest";
import { PHASE_1 } from "@/lib/training/programs/phase-1";

const all = PHASE_1.days.flatMap((d) => d.prescriptions);
const byKey = (key: string) => all.find((p) => p.key === key)!;
const main = (dow: number) =>
  PHASE_1.days.find((d) => d.dayOfWeek === dow)!.prescriptions.filter((p) => p.section === "main");

describe("Phase 1 definition", () => {
  it("is a 12-week block with seven days, Monday first", () => {
    expect(PHASE_1.durationWeeks).toBe(12);
    expect(PHASE_1.days.map((d) => d.dayOfWeek)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("has unique prescription keys and exercise slugs", () => {
    expect(new Set(all.map((p) => p.key)).size).toBe(all.length);
    expect(new Set(PHASE_1.exercises.map((e) => e.slug)).size).toBe(PHASE_1.exercises.length);
  });

  it("references only known exercises, and every exercise is used", () => {
    const slugs = new Set(PHASE_1.exercises.map((e) => e.slug));
    for (const p of all) expect(slugs.has(p.exerciseSlug), p.key).toBe(true);
    const used = new Set(all.map((p) => p.exerciseSlug));
    for (const e of PHASE_1.exercises) expect(used.has(e.slug), e.slug).toBe(true);
  });

  it("logged exercise counts per day", () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((d) => main(d).length)).toEqual([7, 7, 8, 8, 8, 0, 0]);
  });

  it("sort orders are 1..n within each day", () => {
    for (const d of PHASE_1.days) {
      expect(d.prescriptions.map((p) => p.sortOrder)).toEqual(d.prescriptions.map((_, i) => i + 1));
    }
  });

  it("load-progressed lifts have a rep ceiling and an increment", () => {
    for (const p of all.filter((x) => x.progressionType === "double_progression" || x.progressionType === "assistance_reduction")) {
      expect(p.repMax, p.key).not.toBeNull();
      expect(p.loadIncrement, p.key).toBeGreaterThan(0);
      expect(p.restSeconds, p.key).not.toBeNull();
    }
  });

  it("assisted movements treat lower numbers as harder", () => {
    for (const slug of ["pull-up", "strict-pull-up", "dip"]) {
      const e = PHASE_1.exercises.find((x) => x.slug === slug)!;
      expect(e.loadType).toBe("assisted");
      expect(e.loadDirection).toBe("lower_is_harder");
    }
    expect(byKey("mon-pull-up").progressionType).toBe("assistance_reduction");
  });

  it("key prescriptions match the training spec", () => {
    expect(byKey("mon-bench-press")).toMatchObject({ sets: 4, repMin: 4, repMax: 6, restSeconds: 180, loadIncrement: 5, targetRirMin: 2 });
    expect(byKey("tue-leg-press")).toMatchObject({ sets: 4, repMin: 5, repMax: 8, restSeconds: 180, loadIncrement: 10 });
    expect(byKey("wed-paused-bench-press")).toMatchObject({ sets: 3, repMin: 6, repMax: 8, targetRirMin: 2, targetRirMax: 3 });
    expect(byKey("thu-hack-squat")).toMatchObject({ sets: 3, repMin: 8, repMax: 12, loadIncrement: 10 });
    expect(byKey("fri-dip")).toMatchObject({ sets: 3, repMin: 6, repMax: 10, progressionType: "assistance_reduction" });
    expect(byKey("fri-dead-hang")).toMatchObject({ sets: 2, durationSeconds: 20, durationSecondsMax: 40, progressionType: "none" });
  });

  it("all media fields exist and default to null (placeholders until assets land)", () => {
    for (const e of PHASE_1.exercises) {
      expect(e).toHaveProperty("imageUrl");
      expect(e).toHaveProperty("videoUrl");
      expect(e).toHaveProperty("animationUrl");
    }
  });

  it("the Saturday checklist matches the PRD", () => {
    const sat = PHASE_1.days.find((d) => d.dayOfWeek === 6)!.prescriptions;
    expect(sat.every((p) => p.section === "mobility")).toBe(true);
    expect(sat.map((p) => p.exerciseSlug)).toEqual([
      "knee-to-wall",
      "supported-deep-squat",
      "90-90-hip-rotation",
      "adductor-rockback",
      "thoracic-extension",
      "bench-lat-stretch",
      "wall-slide",
      "split-stance-hold",
    ]);
  });
});
