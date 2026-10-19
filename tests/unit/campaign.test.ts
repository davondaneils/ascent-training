import { describe, expect, it } from "vitest";
import { addCalendarYears, campaignPosition, missionsForDate, scheduledMissionCount } from "@/lib/campaign/schedule";
import { CAMPAIGN_CYCLES } from "@/lib/campaign/roadmap";
import { PLAYBOOK } from "@/lib/campaign/playbook";
import { isValidBenchmarkValue } from "@/lib/campaign/benchmarks";

const start = "2026-09-28"; // Monday

describe("five-year campaign", () => {
  it("defines twenty distinct 13-week arcs", () => {
    expect(CAMPAIGN_CYCLES).toHaveLength(20);
    expect(new Set(CAMPAIGN_CYCLES.map((c) => c.id)).size).toBe(20);
    expect(CAMPAIGN_CYCLES[19].year).toBe(5);
    expect(Object.keys(PLAYBOOK)).toHaveLength(20);
    for (const cycle of CAMPAIGN_CYCLES) {
      expect(PLAYBOOK[cycle.id]).toHaveLength(6);
      expect(PLAYBOOK[cycle.id].every((practice) => practice.standard.length > 10)).toBe(true);
    }
  });
  it("calculates civil anniversaries without DST drift", () => {
    expect(addCalendarYears("2026-09-28", 5)).toBe("2031-09-28");
    expect(addCalendarYears("2028-02-29", 1)).toBe("2029-03-01");
    expect(campaignPosition(start, start).dayNumber).toBe(1);
    expect(campaignPosition(start, "2031-09-28").status).toBe("complete");
    expect(campaignPosition(start, "2026-09-27").status).toBe("before_start");
  });
  it("advances through years, cycles, and assessment weeks", () => {
    expect(campaignPosition(start, "2026-09-28").cycleIndex).toBe(0);
    expect(campaignPosition(start, "2026-12-28").cycleIndex).toBe(1);
    expect(campaignPosition(start, "2027-09-28").year).toBe(2);
    expect(campaignPosition(start, "2031-09-27").cycleIndex).toBe(19);
  });
  it("accepts honest zero pull-up baselines while rejecting fabricated and invalid values", () => {
    expect(isValidBenchmarkValue("pullups_strict", 0)).toBe(true);
    expect(isValidBenchmarkValue("pullups_strict", 2.5)).toBe(false);
    expect(isValidBenchmarkValue("run_5k_minutes", 0)).toBe(false);
    expect(isValidBenchmarkValue("run_5k_minutes", 25.3)).toBe(true);
    expect(isValidBenchmarkValue("not-real", 1)).toBe(false);
  });
  it("schedules two missions Mon-Sat with a Sunday of rest", () => {
    expect(missionsForDate(start, "2026-09-28")).toHaveLength(2);
    expect(missionsForDate(start, "2026-10-04")).toEqual([]);
    expect(missionsForDate(start, "2026-09-27")).toEqual([]);
    expect(scheduledMissionCount(start, start, "2026-10-04")).toBe(12);
  });
  it("generates stable ids and makes the capstone evidence-based", () => {
    const date = "2026-12-26"; // Saturday, week 13
    const missions = missionsForDate(start, date);
    expect(missions.map((m) => m.id)).toEqual(missionsForDate(start, date).map((m) => m.id));
    expect(missions[1].title).toContain("Crucible");
    expect(missions[1].requiresEvidence).toBe(true);
    expect(missions[1].instructions).toContain("non-confrontational");
  });
});
