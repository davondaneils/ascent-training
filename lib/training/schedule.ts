// Which week, which day, which prescription. Pure; the caller supplies "now".

import { addDays, daysBetween, dayOfWeek, toLocalDate, PROGRAM_TIME_ZONE } from "@/lib/dates";
import { applyDeload, isDeloadWeek } from "./deload";
import type {
  CardioPrescription,
  DayOfWeek,
  Enrollment,
  LocalDate,
  Prescription,
  ProgramBlock,
  ProgramDay,
} from "./types";

export type ProgramPosition =
  | { status: "before_start"; startDate: LocalDate; daysUntilStart: number }
  | { status: "active"; week: number; absoluteWeek: number; wave: number; isDeload: boolean };

/**
 * `floor((date - start) / 7) + 1`, clamped to the block length (docs/05-DATA.md).
 * Before the start date there is no program week yet.
 */
export function programWeek(startDate: LocalDate, date: LocalDate, durationWeeks: number): number {
  const week = Math.floor(daysBetween(startDate, date) / 7) + 1;
  return Math.min(Math.max(week, 1), durationWeeks);
}

export function programPosition(
  block: ProgramBlock,
  enrollment: Enrollment,
  date: LocalDate,
): ProgramPosition {
  const offset = daysBetween(enrollment.startDate, date);
  if (offset < 0) {
    return { status: "before_start", startDate: enrollment.startDate, daysUntilStart: -offset };
  }
  const absoluteWeek = Math.floor(offset / 7) + 1;
  // Four 13-week arcs leave one or two extra calendar days each year.
  // Do not start an unintended second wave during that recovery interval.
  const readiness = block.slug.startsWith("readiness-");
  const week = readiness ? Math.min(absoluteWeek, block.durationWeeks)
    : ((absoluteWeek - 1) % block.durationWeeks) + 1;
  const wave = readiness ? 1 : Math.floor((absoluteWeek - 1) / block.durationWeeks) + 1;
  return { status: "active", week, absoluteWeek, wave, isDeload: isDeloadWeek(block, week) };
}

export function getProgramDay(block: ProgramBlock, dow: DayOfWeek): ProgramDay {
  const day = block.days.find((d) => d.dayOfWeek === dow);
  if (!day) throw new Error(`Program ${block.slug} has no day ${dow}`);
  return day;
}

export function getCardio(
  block: ProgramBlock,
  week: number,
  dow: DayOfWeek,
): CardioPrescription | null {
  return block.cardio.find((c) => c.weekNumber === week && c.dayOfWeek === dow) ?? null;
}

/** Wave 1 builds the aerobic base; subsequent waves retain the established baseline
 * with a lighter prescription every deload week. Full future blocks remain separate work. */
export function getCardioForWave(
  block: ProgramBlock, week: number, dow: DayOfWeek, wave: number,
): CardioPrescription | null {
  if (dow === 7) return null;
  if (wave <= 1) return getCardio(block, week, dow);
  return getCardio(block, isDeloadWeek(block, week) ? 12 : 11, dow);
}

export interface ResolvedDay {
  date: LocalDate;
  dayOfWeek: DayOfWeek;
  week: number;
  absoluteWeek: number;
  wave: number;
  isDeload: boolean;
  day: ProgramDay;
  /** Warm-up checklist before exercise 1. */
  prep: Prescription[];
  /** Focused, logged exercises in prescribed order. */
  exercises: Prescription[];
  /** Saturday checklist. */
  mobility: Prescription[];
  cardio: CardioPrescription | null;
}

/** The prescription for a given program week and date, with deload applied. */
export function resolveDay(block: ProgramBlock, week: number, date: LocalDate, wave = 1): ResolvedDay {
  const dow = dayOfWeek(date);
  const isDeload = isDeloadWeek(block, week);
  const base = getProgramDay(block, dow);
  const prescriptions = [...base.prescriptions]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => (isDeload ? applyDeload(p) : p));
  const day = { ...base, prescriptions };
  return {
    date,
    dayOfWeek: dow,
    week,
    absoluteWeek: (wave - 1) * block.durationWeeks + week,
    wave,
    isDeload,
    day,
    prep: prescriptions.filter((p) => p.section === "prep"),
    exercises: prescriptions.filter((p) => p.section === "main"),
    mobility: prescriptions.filter((p) => p.section === "mobility"),
    // Sunday is always Rest / Fast, whatever the data says.
    cardio: getCardioForWave(block, week, dow, wave),
  };
}

export type TodayResolution =
  | { status: "before_start"; date: LocalDate; startDate: LocalDate; daysUntilStart: number }
  | { status: "active"; date: LocalDate; resolved: ResolvedDay };

export function resolveToday(
  block: ProgramBlock,
  enrollment: Enrollment,
  now: Date,
  timeZone: string = PROGRAM_TIME_ZONE,
): TodayResolution {
  const date = toLocalDate(now, timeZone);
  const position = programPosition(block, enrollment, date);
  if (position.status === "before_start") {
    return { status: "before_start", date, startDate: position.startDate, daysUntilStart: position.daysUntilStart };
  }
  return { status: "active", date, resolved: { ...resolveDay(block, position.week, date, position.wave), absoluteWeek: position.absoluteWeek } };
}

/** First and last civil date of an absolute training week (weeks run from the start date). */
export function programWeekRange(startDate: LocalDate, week: number): { from: LocalDate; to: LocalDate } {
  const from = addDays(startDate, (week - 1) * 7);
  return { from, to: addDays(from, 6) };
}

/** Scheduled sessions in a program week, for "2 / 5 lifting · 1 / 4 cardio". */
export function scheduledCounts(block: ProgramBlock, week: number, wave = 1): { lifting: number; cardio: number } {
  return {
    lifting: block.days.filter((d) => d.sessionType === "lifting").length,
    cardio: block.days.filter((d) => getCardioForWave(block, week, d.dayOfWeek, wave) !== null).length,
  };
}

const WORK_SECONDS_PER_SET = 40;
const SETUP_SECONDS_PER_EXERCISE = 60;
const CHECKLIST_SECONDS_PER_SET = 45;

/** Rough session length for the Today card ("~60 min"), rounded to 5 minutes. */
export function estimateDurationMinutes(day: Pick<ResolvedDay, "prep" | "exercises">): number {
  let seconds = 0;
  for (const p of day.prep) {
    seconds += p.sets * (p.durationSeconds ?? CHECKLIST_SECONDS_PER_SET) * (p.perSide ? 2 : 1);
  }
  for (const p of day.exercises) {
    const work = (p.durationSeconds ?? WORK_SECONDS_PER_SET) * (p.perSide ? 2 : 1);
    seconds += SETUP_SECONDS_PER_EXERCISE + p.sets * (work + (p.restSeconds ?? 0));
  }
  return Math.max(5, Math.round(seconds / 300) * 5);
}
