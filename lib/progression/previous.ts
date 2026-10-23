import type { ExercisePerformance, LoggedSet } from "@/lib/training/types";
import { completedSets } from "./reference";

function newestFirst(a: ExercisePerformance, b: ExercisePerformance): number {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
}

function pick(
  history: ExercisePerformance[],
  prescriptionKey: string,
  exerciseSlug: string,
  includeDeload: boolean,
): ExercisePerformance | null {
  const usable = history
    .filter((h) => completedSets(h.sets).length > 0 && (includeDeload || !h.isDeload))
    .sort(newestFirst);
  return (
    usable.find((h) => h.prescriptionKey === prescriptionKey) ??
    usable.find((h) => h.exerciseSlug === exerciseSlug) ??
    null
  );
}

/**
 * What to show under "Previous": the most recent exposure to this prescription
 * (same exercise, same weekday slot), else the most recent exposure to the exercise.
 */
export function getPreviousExercisePerformance(
  history: ExercisePerformance[],
  prescriptionKey: string,
  exerciseSlug: string,
): ExercisePerformance | null {
  return pick(history, prescriptionKey, exerciseSlug, true);
}

/** The session progression is based on: same lookup, but deload sessions never count. */
export function getProgressionSource(
  history: ExercisePerformance[],
  prescriptionKey: string,
  exerciseSlug: string,
): ExercisePerformance | null {
  return pick(history, prescriptionKey, exerciseSlug, false);
}

export function previousSetsInOrder(performance: ExercisePerformance): LoggedSet[] {
  return completedSets(performance.sets);
}

/**
 * Timed carries log the load with reps null, so `completedSets` never sees them. The most recent
 * carry exposure (same slot, else same exercise) that recorded a load, sets in order.
 */
export function previousLoadedHold(
  history: ExercisePerformance[],
  prescriptionKey: string,
  exerciseSlug: string,
): LoggedSet[] | null {
  const usable = history.filter((h) => h.sets.some((s) => s.weight !== null && s.weight > 0)).sort(newestFirst);
  const found = usable.find((h) => h.prescriptionKey === prescriptionKey) ?? usable.find((h) => h.exerciseSlug === exerciseSlug);
  return found ? [...found.sets].sort((a, b) => a.setNumber - b.setNumber) : null;
}
