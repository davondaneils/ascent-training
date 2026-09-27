// Local snapshot of the in-progress workout: cursor, sets, rest timer. Survives reloads.

import type { WorkoutSession } from "@/lib/training/session";

const key = (workoutId: string) => `ascent:session:${workoutId}`;

export function loadLocalSession(workoutId: string): WorkoutSession | null {
  try {
    const raw = localStorage.getItem(key(workoutId));
    return raw ? (JSON.parse(raw) as WorkoutSession) : null;
  } catch {
    return null;
  }
}

export function saveLocalSession(session: WorkoutSession): void {
  try {
    localStorage.setItem(key(session.workoutId), JSON.stringify(session));
  } catch {
    // Private mode / quota: the outbox still carries the writes.
  }
}

export function clearLocalSession(workoutId: string): void {
  try {
    localStorage.removeItem(key(workoutId));
  } catch {
    // ignore
  }
}
