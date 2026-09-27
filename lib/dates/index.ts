// Civil-date helpers. Dates are `YYYY-MM-DD` strings in the program time zone,
// and all arithmetic happens on UTC midnights so DST never shifts a day.

import type { DayOfWeek, LocalDate } from "@/lib/training/types";

export const PROGRAM_TIME_ZONE = "America/Toronto";

const MS_PER_DAY = 86_400_000;
const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** The civil date of `instant` in `timeZone`. */
export function toLocalDate(instant: Date, timeZone: string = PROGRAM_TIME_ZONE): LocalDate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

function toUtcMs(date: LocalDate): number {
  if (!LOCAL_DATE_RE.test(date)) throw new Error(`Invalid local date: ${date}`);
  const [y, m, d] = date.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d);
  if (new Date(ms).getUTCDate() !== d) throw new Error(`Invalid local date: ${date}`);
  return ms;
}

function fromUtcMs(ms: number): LocalDate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromUtcMs(toUtcMs(date) + days * MS_PER_DAY);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

export function dayOfWeek(date: LocalDate): DayOfWeek {
  const js = new Date(toUtcMs(date)).getUTCDay(); // 0 = Sunday
  return (js === 0 ? 7 : js) as DayOfWeek;
}

/** Monday of the calendar week (Mon–Sun) containing `date`. */
export function startOfWeek(date: LocalDate): LocalDate {
  return addDays(date, 1 - dayOfWeek(date));
}

/** `date` if it is a Monday, otherwise the following Monday. */
export function nextMonday(date: LocalDate): LocalDate {
  const dow = dayOfWeek(date);
  return dow === 1 ? date : addDays(date, 8 - dow);
}
