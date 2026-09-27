// Timestamp-based timers. The UI derives what to show from `now`, so a backgrounded
// tab or a reload never drifts: nothing counts down, only `endsAt` is stored.

export interface RestTimer {
  startedAt: number; // epoch ms
  endsAt: number; // epoch ms
}

export function startRest(now: number, seconds: number): RestTimer {
  return { startedAt: now, endsAt: now + seconds * 1000 };
}

export function remainingMs(timer: RestTimer, now: number): number {
  return Math.max(0, timer.endsAt - now);
}

export function isRestComplete(timer: RestTimer, now: number): boolean {
  return now >= timer.endsAt;
}

/** `+30 sec`: extends a running timer; if rest already ended, restarts from now. */
export function extendRest(timer: RestTimer, now: number, seconds = 30): RestTimer {
  const base = Math.max(timer.endsAt, now);
  return { startedAt: timer.startedAt, endsAt: base + seconds * 1000 };
}

/** `Skip`: rest ends immediately. */
export function skipRest(timer: RestTimer, now: number): RestTimer {
  return { startedAt: timer.startedAt, endsAt: Math.min(timer.endsAt, now) };
}

/** 0 → 1 as rest elapses. */
export function restProgress(timer: RestTimer, now: number): number {
  const total = timer.endsAt - timer.startedAt;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now - timer.startedAt) / total));
}

// ---------------------------------------------------------------------------
// Stopwatch with pause, for cardio and timed holds.

export interface Stopwatch {
  /** Epoch ms when the current running segment began; null while paused. */
  runningSince: number | null;
  /** Elapsed ms banked from earlier segments. */
  accumulatedMs: number;
}

export function startStopwatch(now: number): Stopwatch {
  return { runningSince: now, accumulatedMs: 0 };
}

export function elapsedMs(sw: Stopwatch, now: number): number {
  return sw.accumulatedMs + (sw.runningSince === null ? 0 : Math.max(0, now - sw.runningSince));
}

export function pauseStopwatch(sw: Stopwatch, now: number): Stopwatch {
  if (sw.runningSince === null) return sw;
  return { runningSince: null, accumulatedMs: elapsedMs(sw, now) };
}

export function resumeStopwatch(sw: Stopwatch, now: number): Stopwatch {
  if (sw.runningSince !== null) return sw;
  return { runningSince: now, accumulatedMs: sw.accumulatedMs };
}

// ---------------------------------------------------------------------------

/** `m:ss`, rounding up so a fresh 3-minute timer reads 3:00 and 0.2 s left reads 0:01. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
