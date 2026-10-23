// Cardio session state machine: ready → running ⇄ paused → rating → saved. Pure; time is passed in.

import { elapsedMs, pauseStopwatch, resumeStopwatch, startStopwatch, type Stopwatch } from "./rest-timer";
import type { CardioModality, CardioPrescription } from "./types";

/** Easy aerobic work is always RPE ≤ 4; a run prescribed above that is the weekly quality session. */
export function isQualityRun(p: Pick<CardioPrescription, "modality" | "targetRpeMax">): boolean {
  return p.modality === "run" && p.targetRpeMax > 4;
}

/** Upper bound for a recorded pack, kg. Matches the cardio_logs check constraint. */
export const MAX_PACK_KG = 40;

export type CardioPhase = "ready" | "running" | "paused" | "rating" | "saved";

export interface CardioSession {
  logId: string;
  date: string;
  modality: CardioModality;
  targetMinutes: number;
  phase: CardioPhase;
  stopwatch: Stopwatch | null;
  /** Frozen when the user taps Finish. */
  finalElapsedMs: number | null;
  rpe: number | null;
  /** Loaded hikes only: pack weight in kg, optional. Absent in snapshots saved before it existed. */
  packWeightKg?: number | null;
}

export type CardioAction =
  | { type: "set_modality"; modality: CardioModality }
  | { type: "start"; now: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "finish"; now: number }
  | { type: "back_to_timer"; now: number }
  | { type: "rate"; rpe: number }
  | { type: "set_pack_weight"; kg: number | null }
  | { type: "saved" };

export function createCardioSession(input: {
  logId: string;
  date: string;
  modality: CardioModality;
  targetMinutes: number;
}): CardioSession {
  return { ...input, phase: "ready", stopwatch: null, finalElapsedMs: null, rpe: null, packWeightKg: null };
}

export function cardioElapsedMs(s: CardioSession, now: number): number {
  if (s.finalElapsedMs !== null) return s.finalElapsedMs;
  return s.stopwatch ? elapsedMs(s.stopwatch, now) : 0;
}

/** Whole minutes for the log. Rounds to nearest; 30 s or more counts as a minute. */
export function actualMinutes(ms: number): number {
  return Math.max(0, Math.round(ms / 60_000));
}

export function cardioReducer(s: CardioSession, a: CardioAction): CardioSession {
  switch (a.type) {
    case "set_modality":
      return s.phase === "ready" ? { ...s, modality: a.modality } : s;
    case "start":
      return s.phase === "ready" ? { ...s, phase: "running", stopwatch: startStopwatch(a.now) } : s;
    case "pause":
      return s.phase === "running" && s.stopwatch
        ? { ...s, phase: "paused", stopwatch: pauseStopwatch(s.stopwatch, a.now) }
        : s;
    case "resume":
      return s.phase === "paused" && s.stopwatch
        ? { ...s, phase: "running", stopwatch: resumeStopwatch(s.stopwatch, a.now) }
        : s;
    case "finish":
      if (s.phase !== "running" && s.phase !== "paused") return s;
      return {
        ...s,
        phase: "rating",
        stopwatch: s.stopwatch ? pauseStopwatch(s.stopwatch, a.now) : null,
        finalElapsedMs: cardioElapsedMs(s, a.now),
      };
    case "back_to_timer":
      // Tapped Finish by mistake: continue where it stopped (paused).
      return s.phase === "rating" ? { ...s, phase: "paused", finalElapsedMs: null } : s;
    case "rate":
      return s.phase === "rating" && a.rpe >= 1 && a.rpe <= 10 ? { ...s, rpe: a.rpe } : s;
    case "set_pack_weight":
      if (s.phase !== "rating" || s.modality !== "loaded_hike") return s;
      if (a.kg !== null && !(Number.isFinite(a.kg) && a.kg >= 0 && a.kg <= MAX_PACK_KG)) return s;
      return { ...s, packWeightKg: a.kg === null ? null : Math.round(a.kg * 10) / 10 };
    case "saved":
      return s.phase === "rating" && s.rpe !== null ? { ...s, phase: "saved" } : s;
  }
}
