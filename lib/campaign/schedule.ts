import { addDays, dayOfWeek, daysBetween } from "@/lib/dates";
import type { LocalDate } from "@/lib/training/types";
import { CAMPAIGN_CYCLES, WEEK_STAGES, type CampaignCycle } from "./roadmap";
import { PLAYBOOK } from "./playbook";

export type MissionDomain = "faith" | "medical" | "navigation" | "household" | "mind" | "service" | "field";
export type MissionOutcome = "completed" | "needs_work";

export interface Mission {
  id: string;
  date: LocalDate;
  domain: MissionDomain;
  title: string;
  instructions: string;
  stakes: string;
  success: string;
  minutes: number;
  requiresEvidence: boolean;
}
export interface MissionLog {
  missionId: string;
  status: MissionOutcome;
  evidence: string | null;
}

export interface CampaignPosition {
  status: "before_start" | "active" | "complete";
  startDate: LocalDate;
  date: LocalDate;
  endDate: LocalDate;
  dayNumber: number;
  totalDays: number;
  year: number;
  cycleIndex: number;
  cycleNumber: number;
  weekInCycle: number;
  stage: string;
  cycle: CampaignCycle;
}

/** Civil calendar years, no millisecond DST arithmetic. End date is exclusive. */
export function addCalendarYears(date: LocalDate, years: number): LocalDate {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export function campaignPosition(startDate: LocalDate, date: LocalDate): CampaignPosition {
  const endDate = addCalendarYears(startDate, 5);
  const totalDays = daysBetween(startDate, endDate);
  const elapsed = daysBetween(startDate, date);
  const status = elapsed < 0 ? "before_start" : elapsed >= totalDays ? "complete" : "active";
  const bounded = Math.max(0, Math.min(elapsed, totalDays - 1));
  let year = 1;
  while (year < 5 && addCalendarYears(startDate, year) <= addDays(startDate, bounded)) year++;
  const yearStart = addCalendarYears(startDate, year - 1);
  const yearElapsed = daysBetween(yearStart, addDays(startDate, bounded));
  // Four 13-week arcs per calendar year; any extra leap/anniversary days fall in Q4.
  const quarter = Math.min(3, Math.floor(yearElapsed / 91));
  const cycleIndex = (year - 1) * 4 + quarter;
  const weekInCycle = Math.min(13, Math.floor((yearElapsed - quarter * 91) / 7) + 1);
  return {
    status, startDate, date, endDate, dayNumber: Math.max(0, Math.min(totalDays, elapsed + 1)),
    totalDays, year, cycleIndex, cycleNumber: cycleIndex + 1, weekInCycle,
    stage: WEEK_STAGES[weekInCycle - 1], cycle: CAMPAIGN_CYCLES[cycleIndex],
  };
}

const SCRIPTURE = [
  { passage: "Matthew 5:1-16", theme: "Courage expressed through mercy and integrity" },
  { passage: "Matthew 5:38-48", theme: "Refusing hatred even under hostility" },
  { passage: "Matthew 6:19-34", theme: "Trust rather than fear of losing possessions" },
  { passage: "Romans 12:9-21", theme: "Overcoming evil with good" },
  { passage: "James 1:2-27", theme: "Steadfastness that becomes action" },
  { passage: "1 Peter 3:8-17", theme: "Giving a reason for hope with gentleness" },
  { passage: "Psalm 23", theme: "Trust in frightening conditions" },
  { passage: "Psalm 46", theme: "Refuge in times of upheaval" },
  { passage: "Acts 4:1-31", theme: "Conviction under pressure" },
  { passage: "2 Timothy 1:6-14", theme: "Courage and self-control" },
  { passage: "Luke 10:25-37", theme: "Showing mercy to a stranger" },
  { passage: "Ephesians 6:10-20", theme: "Spiritual perseverance, truth, and prayer" },
  { passage: "John 15:9-17", theme: "Sacrificial love" },
] as const;

export function missionsForDate(startDate: LocalDate, date: LocalDate): Mission[] {
  const position = campaignPosition(startDate, date);
  if (position.status !== "active") return [];
  const dow = dayOfWeek(date);
  // Sunday is worship, hospitality, and recovery, not a checklist.
  if (dow === 7) return [];
  const scripture = SCRIPTURE[(position.weekInCycle - 1) % SCRIPTURE.length];
  const faith: Mission = {
    id: "scripture:" + date, date, domain: "faith", title: "Scripture & prayer",
    instructions: "Read " + scripture.passage + ". Reflect on " + scripture.theme.toLowerCase() +
      ". Pray for your family, vulnerable people, and those you fear. Write one sentence of application.",
    stakes: "Faithful conviction must endure fear without turning into hatred.",
    success: "Read, pray, and write one honest sentence.", minutes: 30, requiresEvidence: false,
  };
  const daily = PLAYBOOK[position.cycle.id]?.[dow - 1];
  if (!daily) throw new Error(`Missing campaign practice: ${position.cycle.id}, day ${dow}`);
  const crucible = dow === 6 && position.weekInCycle === 13;
  const mission: Mission = {
    id: "practice:" + date, date, domain: daily.domain,
    title: crucible ? "Crucible: " + position.cycle.title : daily.title,
    instructions: crucible
      ? "Scenario: " + position.cycle.scenario + " Assessment: " + position.cycle.capstone +
        " Use a supervised, civilian, non-confrontational exercise. Stop if conditions are unsafe."
      : "Cycle focus: " + position.cycle.focus + ". Week " + position.weekInCycle + ": " +
        position.stage + ". " + daily.action,
    stakes: "Scenario: " + position.cycle.scenario +
      " Could you respond with competence, calm, and care?",
    success: crucible
      ? "Record observable evidence and whether you met the standard or need more work."
      : daily.standard + " Long-term target: " + position.cycle.capability + ".",
    minutes: crucible ? 90 : daily.minutes,
    requiresEvidence: crucible,
  };
  return [faith, mission];
}

export function scheduledMissionCount(startDate: LocalDate, from: LocalDate, to: LocalDate): number {
  const first = daysBetween(startDate, from) < 0 ? startDate : from;
  let total = 0;
  for (let d = first; d <= to; d = addDays(d, 1)) total += missionsForDate(startDate, d).length;
  return total;
}
