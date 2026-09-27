// Progress metrics derived only from logged training. Pure; used by the Progress screen.

import { addDays, dayOfWeek, daysBetween } from "@/lib/dates";
import { completedSets } from "@/lib/progression/reference";
import { programWeek } from "./schedule";
import type { ExercisePerformance, LocalDate, ProgramBlock } from "./types";

// ---------------------------------------------------------------------------
// Strength

export interface StrengthPoint {
  date: LocalDate;
  /** Heaviest weight lifted for a completed set that session. */
  topWeight: number;
  /** Most reps done at that weight. */
  topReps: number;
  /** Epley estimate from the best set; secondary. */
  e1rm: number;
}

export function epley(weight: number, reps: number): number {
  return reps <= 1 ? weight : weight * (1 + reps / 30);
}

/** One point per session (merging sessions on the same date), oldest first. */
export function strengthSeries(history: ExercisePerformance[]): StrengthPoint[] {
  const byDate = new Map<LocalDate, StrengthPoint>();
  for (const h of history) {
    for (const s of completedSets(h.sets)) {
      if (s.weight === null || s.reps === null) continue;
      const e1rm = epley(s.weight, s.reps);
      const cur = byDate.get(h.date);
      if (!cur) {
        byDate.set(h.date, { date: h.date, topWeight: s.weight, topReps: s.reps, e1rm });
        continue;
      }
      if (s.weight > cur.topWeight || (s.weight === cur.topWeight && s.reps > cur.topReps)) {
        cur.topWeight = s.weight;
        cur.topReps = s.reps;
      }
      cur.e1rm = Math.max(cur.e1rm, e1rm);
    }
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** "+10 lb over 8 weeks", "Same load for 3 weeks", "First session logged". */
export function strengthSummary(points: StrengthPoint[]): string | null {
  if (points.length === 0) return null;
  if (points.length === 1) return "First session logged";
  const first = points[0];
  const last = points[points.length - 1];
  const weeks = Math.max(1, Math.round(daysBetween(first.date, last.date) / 7));
  const span = `${weeks} week${weeks === 1 ? "" : "s"}`;
  const diff = last.topWeight - first.topWeight;
  if (diff > 0) return `+${fmt(diff)} lb over ${span}`;
  if (diff < 0) return `−${fmt(-diff)} lb over ${span}`;
  const reps = last.topReps - first.topReps;
  return reps > 0 ? `+${reps} reps at ${fmt(last.topWeight)} lb over ${span}` : `Same load for ${span}`;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

// ---------------------------------------------------------------------------
// Relative strength (pull-ups, dips): weight is assistance, lower is harder.

export interface RepsPoint {
  date: LocalDate;
  /** Most reps in a single set. */
  bestReps: number;
  /** Total reps across sets. */
  totalReps: number;
  /** Least assistance used that session (0 = unassisted), null if not recorded. */
  assistance: number | null;
}

export function repsSeries(history: ExercisePerformance[]): RepsPoint[] {
  const byDate = new Map<LocalDate, RepsPoint>();
  for (const h of history) {
    for (const s of completedSets(h.sets)) {
      const reps = s.reps ?? 0;
      const cur = byDate.get(h.date) ?? { date: h.date, bestReps: 0, totalReps: 0, assistance: null };
      cur.bestReps = Math.max(cur.bestReps, reps);
      cur.totalReps += reps;
      if (s.weight !== null) cur.assistance = cur.assistance === null ? s.weight : Math.min(cur.assistance, s.weight);
      byDate.set(h.date, cur);
    }
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function repsSummary(points: RepsPoint[]): string | null {
  if (points.length === 0) return null;
  const last = points[points.length - 1];
  const assist = last.assistance === null || last.assistance === 0 ? "bodyweight" : `−${fmt(last.assistance)} lb assist`;
  if (points.length === 1) return `Best set ${last.bestReps} reps · ${assist}`;
  const first = points[0];
  if (first.assistance !== null && last.assistance !== null && last.assistance < first.assistance) {
    return `Assistance ${fmt(first.assistance)} → ${fmt(last.assistance)} lb · best set ${last.bestReps}`;
  }
  const d = last.bestReps - first.bestReps;
  return `${d > 0 ? `+${d}` : d === 0 ? "Same" : d} best-set reps · ${assist}`;
}

// ---------------------------------------------------------------------------
// Cardio

export interface CardioLogPoint {
  date: LocalDate;
  actualMinutes: number;
  rpe: number;
}

export interface WeekMinutes {
  week: number;
  minutes: number;
  isDeload: boolean;
}

/** Aerobic minutes per program week, weeks 1..currentWeek (zeros included). */
export function weeklyAerobicMinutes(
  logs: CardioLogPoint[],
  block: Pick<ProgramBlock, "durationWeeks" | "deloadWeeks">,
  startDate: LocalDate,
  currentWeek: number,
): WeekMinutes[] {
  const weeks: WeekMinutes[] = Array.from({ length: currentWeek }, (_, i) => ({
    week: i + 1,
    minutes: 0,
    isDeload: block.deloadWeeks.includes(i + 1),
  }));
  for (const l of logs) {
    if (daysBetween(startDate, l.date) < 0) continue;
    const w = programWeek(startDate, l.date, block.durationWeeks);
    if (w <= currentWeek) weeks[w - 1].minutes += l.actualMinutes;
  }
  return weeks;
}

export function longestSession(logs: CardioLogPoint[]): CardioLogPoint | null {
  return logs.reduce<CardioLogPoint | null>((best, l) => (!best || l.actualMinutes > best.actualMinutes ? l : best), null);
}

/** Most recent RPE values, newest first. */
export function recentRpe(logs: CardioLogPoint[], n = 5): number[] {
  return [...logs].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, n).map((l) => l.rpe);
}

// ---------------------------------------------------------------------------
// Consistency

export interface Consistency {
  lifting: { done: number; scheduled: number };
  cardio: { done: number; scheduled: number };
  /** Completed sessions / all sessions in the block, 0–100. */
  blockPercent: number;
}

/**
 * Scheduled counts are "to date": sessions on or before `today` since the start date.
 * Lifting days are Mon–Fri program days; cardio comes from the week-by-week prescriptions.
 */
export function consistency(input: {
  block: ProgramBlock;
  startDate: LocalDate;
  today: LocalDate;
  completedLiftingDates: LocalDate[];
  cardioDates: LocalDate[];
}): Consistency {
  const { block, startDate, today } = input;
  const liftingDays = new Set(block.days.filter((d) => d.sessionType === "lifting").map((d) => d.dayOfWeek));
  const totalDays = block.durationWeeks * 7;
  const elapsed = Math.min(totalDays, Math.max(0, daysBetween(startDate, today) + 1));

  let liftingScheduled = 0;
  let cardioScheduled = 0;
  let liftingTotal = 0;
  let cardioTotal = 0;
  for (let i = 0; i < totalDays; i++) {
    const week = Math.floor(i / 7) + 1;
    const dow = dayOfWeek(addDays(startDate, i)); // program days follow the calendar
    const lifts = liftingDays.has(dow) ? 1 : 0;
    const cardio = block.cardio.some((c) => c.weekNumber === week && c.dayOfWeek === dow) ? 1 : 0;
    liftingTotal += lifts;
    cardioTotal += cardio;
    if (i < elapsed) {
      liftingScheduled += lifts;
      cardioScheduled += cardio;
    }
  }

  // Only sessions in the block and not after today, so "done" can never exceed "scheduled to date".
  const inBlock = (d: LocalDate) =>
    daysBetween(startDate, d) >= 0 && daysBetween(startDate, d) < totalDays && daysBetween(d, today) >= 0;
  const liftingDone = new Set(input.completedLiftingDates.filter(inBlock)).size;
  const cardioDone = new Set(input.cardioDates.filter(inBlock)).size;
  const total = liftingTotal + cardioTotal;

  return {
    lifting: { done: liftingDone, scheduled: liftingScheduled },
    cardio: { done: cardioDone, scheduled: cardioScheduled },
    blockPercent: total === 0 ? 0 : Math.round(((liftingDone + cardioDone) / total) * 100),
  };
}

