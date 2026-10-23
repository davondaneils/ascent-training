import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { READINESS_BLOCKS, createReadinessBlock, physicalBlockForDate } from "@/lib/training/programs/readiness";
import { CAMPAIGN_CYCLES } from "@/lib/campaign/roadmap";
import { buildSeed } from "../../scripts/seed-sql";
import { resolveToday, scheduledCounts } from "@/lib/training/schedule";
import { isQualityRun } from "@/lib/training/cardio";
import { qualityRun } from "@/lib/training/programs/readiness";

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
        // Only the weekly quality run rises above easy effort.
        if (!isQualityRun(c)) expect(c.targetRpeMax).toBeLessThanOrEqual(4);
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
  it("expands BOTH log and prescription database constraints before seeding advanced modalities", () => {
    const migration = readFileSync(resolve("supabase/migrations/20261019000002_physical_training.sql"), "utf8");
    expect(migration).toContain("alter table public.cardio_prescriptions");
    expect(migration).toContain("alter table public.cardio_logs");
    for (const mode of ["run_walk","run","swim","hike","loaded_hike"]) {
      expect(migration.split("'"+mode+"'").length).toBeGreaterThanOrEqual(3);
    }
  });
  it("seeds new blocks as inactive without changing the original active Phase 1", () => {
    const sql = buildSeed(createReadinessBlock(0), false);
    expect(sql).toContain("'readiness-first-response'");
    expect(sql).toContain("'{4,8,13}'::int[], false)");
    expect(sql).toContain("on conflict (key) do update");
    expect(sql).not.toContain("delete from public.workouts");
  });
  it("casts nullable seed columns so all-null VALUES columns are not typed as text", () => {
    const sql = buildSeed(createReadinessBlock(0), false);
    expect(sql).toContain("v.sets_max::int");
    expect(sql).toContain("v.target_minutes_max::int");
    expect(sql).toContain("v.load_increment::numeric");
  });
  it("names Thursday by what the cycle actually prescribes", () => {
    expect(createReadinessBlock(0).days.find((d) => d.dayOfWeek === 4)?.name).toBe("Easy Aerobic & Mobility");
    expect(createReadinessBlock(1).days.find((d) => d.dayOfWeek === 4)?.name).toBe("Water Skills & Mobility");
  });
  it("adds one weekly quality run only in run cycles, never in recovery weeks", () => {
    for (const [i, block] of READINESS_BLOCKS.entries()) {
      const quality = block.cardio.filter(isQualityRun);
      const runs = block.cardio.filter((c) => c.modality === "run");
      if (runs.length === 0) {
        expect(quality, block.slug).toEqual([]);
        continue;
      }
      expect(i).toBeGreaterThanOrEqual(6); // Year 2 onward
      expect(quality.map((c) => c.weekNumber)).toEqual([1, 2, 3, 5, 6, 7, 9, 10, 11, 12]);
      expect(quality.every((c) => c.dayOfWeek === 2)).toBe(true);
      // Swim and hike days, and every recovery-week run, stay easy.
      for (const c of block.cardio.filter((x) => !isQualityRun(x))) expect(c.targetRpeMax).toBeLessThanOrEqual(4);
      for (const c of quality) {
        expect(c.targetRpeMax).toBeLessThanOrEqual(7);
        expect(c.notes).toMatch(/10 min very easy jogging first/);
        expect(c.notes).toMatch(/If anything hurts.*drop to easy running or walking/);
      }
    }
    expect(READINESS_BLOCKS.slice(0, 6).flatMap((b) => b.cardio).some(isQualityRun)).toBe(false);
  });
  it("progresses quality gently: strides first, then short tempo and short intervals that fit the session", () => {
    expect(READINESS_BLOCKS[6].cardio.filter(isQualityRun).every((c) => /strides/.test(c.notes ?? ""))).toBe(true);
    expect(READINESS_BLOCKS[7].cardio.find((c) => c.weekNumber === 1 && c.dayOfWeek === 2)?.notes).toMatch(/2 × 3 min tempo/);
    expect(READINESS_BLOCKS[7].cardio.find((c) => c.weekNumber === 2 && c.dayOfWeek === 2)?.notes).toMatch(/4 × 1 min brisk/);
    for (const [i, block] of READINESS_BLOCKS.entries()) {
      for (const c of block.cardio.filter(isQualityRun)) {
        const q = qualityRun(i, c.weekNumber, c.targetMinutes)!;
        expect(10 + q.workMinutes, `${block.slug} w${c.weekNumber}`).toBeLessThanOrEqual(c.targetMinutes - 5);
        const tempo = /(\d+) min continuous tempo/.exec(c.notes ?? "");
        if (tempo) expect(Number(tempo[1])).toBeLessThanOrEqual(20);
      }
    }
    for (const w of [4, 8, 13]) expect(qualityRun(10, w, 45)).toBeNull();
    expect(qualityRun(5, 1, 45)).toBeNull();
  });
  it("lets the farmer's carry record a load without changing its timed prescription", () => {
    const block = READINESS_BLOCKS[0];
    expect(block.exercises.find((e) => e.slug === "farmer-carry")?.loadType).toBe("dumbbell");
    const carry = block.days.flatMap((d) => d.prescriptions).filter((p) => p.key.endsWith(":carry"));
    expect(carry).toHaveLength(3);
    for (const p of carry) {
      expect(p.durationSeconds).toBeGreaterThan(0);
      expect(p.progressionType).toBe("none"); // never auto-increased
    }
  });
  it("adds pack weight with an additive, nullable migration", () => {
    const migration = readFileSync(resolve("supabase/migrations/20261022000001_carry_and_pack_load.sql"), "utf8");
    const statements = migration.replace(/--.*$/gm, "").toLowerCase();
    expect(statements).toContain("add column if not exists pack_weight_kg numeric");
    expect(statements).not.toMatch(/\b(drop|delete|update|truncate|not null|default)\b/);
  });
});
