import { describe, expect, it } from "vitest";
import { READINESS_BLOCKS, createReadinessBlock, physicalBlockForDate } from "@/lib/training/programs/readiness";
import { CAMPAIGN_CYCLES } from "@/lib/campaign/roadmap";
import { buildSeed } from "../../scripts/seed-sql";
import { resolveToday, scheduledCounts } from "@/lib/training/schedule";

const START = "2026-09-28";

describe("five-year physical program", () => {
  it("defines 20 different 13-week programs, aligned with each campaign arc", () => {
    expect(READINESS_BLOCKS).toHaveLength(20);
    expect(new Set(READINESS_BLOCKS.map((p) => p.slug)).size).toBe(20);
    expect(READINESS_BLOCKS.map((p) => p.slug)).toEqual(CAMPAIGN_CYCLES.map((x) => "readiness-" + x.id));
    expect(READINESS_BLOCKS.every((p) => p.durationWeeks === 13)).toBe(true);
  });
  it("prescribes three manageable full-body strength days and three endurance days", () => {
    for (const block of READINESS_BLOCKS) {
      expect(block.deloadWeeks).toEqual([4, 8, 13]);
      expect(block.days.map((d) => d.dayOfWeek)).toEqual([1,2,3,4,5,6,7]);
      expect(block.days.filter((d) => d.sessionType === "lifting").map((d) => d.dayOfWeek)).toEqual([1,3,5]);
      expect(block.days.filter((d) => d.sessionType === "aerobic_mobility").map((d) => d.dayOfWeek)).toEqual([2,4,6]);
      expect(block.days[6].sessionType).toBe("rest");
      expect(block.days[6].prescriptions).toEqual([]);
      expect(block.cardio).toHaveLength(39);
      expect(block.cardio.every((c) => [2,4,6].includes(c.dayOfWeek))).toBe(true);
      expect(scheduledCounts(block, 7)).toEqual({ lifting: 3, cardio: 3 });
    }
  });
  it("keeps prescription keys and exercise references valid and stable", () => {
    const all = READINESS_BLOCKS.flatMap((p) => p.days.flatMap((d) => d.prescriptions));
    expect(new Set(all.map((p) => p.key)).size).toBe(all.length);
    for (const block of READINESS_BLOCKS) {
      const known = new Set(block.exercises.map((e) => e.slug));
      for (const day of block.days) {
        for (const [i, p] of day.prescriptions.entries()) {
          expect(known.has(p.exerciseSlug), p.key).toBe(true);
          expect(p.sortOrder).toBe(i + 1);
          expect(p.sets).toBeGreaterThan(0);
          if (p.progressionType === "double_progression" || p.progressionType === "assistance_reduction") {
            expect(p.loadIncrement).toBeGreaterThan(0);
            expect(p.repMax).toBeGreaterThan(0);
          }
        }
      }
    }
  });
  it("uses a gentle early phase and explicitly gates more demanding modes", () => {
    const first = READINESS_BLOCKS[0];
    expect(first.cardio.map((c) => c.modality).every((m) => ["bike","incline_walk","hike"].includes(m))).toBe(true);
    expect(READINESS_BLOCKS[1].cardio.some((c) => c.modality === "run_walk")).toBe(true);
    expect(READINESS_BLOCKS[1].cardio.some((c) => c.modality === "swim")).toBe(true);
    expect(READINESS_BLOCKS[4].cardio.some((c) => c.modality === "loaded_hike")).toBe(true);
    for (const block of READINESS_BLOCKS) {
      for (const c of block.cardio) {
        expect(c.targetRpeMax).toBeLessThanOrEqual(4);
        expect(c.targetMinutes).toBeGreaterThanOrEqual(5);
        if (["run_walk","run","swim","loaded_hike"].includes(c.modality)) {
          expect(c.notes).toMatch(/if|only|supervis/i);
        }
      }
    }
  });
  it("places the correct physical block and local date clock in each of the five years", () => {
    expect(physicalBlockForDate(START, "2026-09-28")).toEqual({
      blockSlug: READINESS_BLOCKS[0].slug, startDate: START, cycleIndex: 0,
    });
    expect(physicalBlockForDate(START, "2026-12-28")).toMatchObject({
      blockSlug: READINESS_BLOCKS[1].slug, startDate: "2026-12-28", cycleIndex: 1,
    });
    expect(physicalBlockForDate(START, "2027-09-28")).toMatchObject({cycleIndex: 4});
    expect(physicalBlockForDate(START, "2030-09-28")).toMatchObject({cycleIndex: 16});
    expect(physicalBlockForDate(START, "2031-09-27")).toMatchObject({cycleIndex: 19});
  });
  it("keeps surplus calendar days in the recovery week instead of an unintended new wave", () => {
    const block = READINESS_BLOCKS[3];
    const p = physicalBlockForDate(START, "2027-09-27");
    expect(p.cycleIndex).toBe(3);
    const today = resolveToday(block, {
      programBlockSlug: block.slug, startDate: p.startDate,
    }, new Date("2027-09-27T16:00:00Z"));
    expect(today.status).toBe("active");
    if (today.status === "active") {
      expect(today.resolved.week).toBe(13);
      expect(today.resolved.wave).toBe(1);
      expect(today.resolved.isDeload).toBe(true);
    }
  });
  it("prescribes a genuinely different Monday in the first phase", () => {
    const block = READINESS_BLOCKS[0];
    const today = resolveToday(block, { programBlockSlug: block.slug, startDate: START }, new Date("2026-09-28T16:00:00Z"));
    expect(today.status).toBe("active");
    if (today.status !== "active") return;
    expect(today.resolved.day.name).toContain("Strength A");
    expect(today.resolved.exercises.map((p) => p.exerciseSlug)).toEqual([
      "bench-press","leg-press","pull-up","chest-supported-row","farmer-carry",
    ]);
    expect(today.resolved.cardio).toBeNull();
    expect(today.resolved.week).toBe(1);
  });
  it("seeds new blocks as inactive without changing the original active Phase 1", () => {
    const sql = buildSeed(createReadinessBlock(0), false);
    expect(sql).toContain("'readiness-first-response'");
    expect(sql).toContain("'{4,8,13}'::int[], false)");
    expect(sql).toContain("on conflict (key) do update");
    expect(sql).not.toContain("delete from public.workouts");
  });
});
