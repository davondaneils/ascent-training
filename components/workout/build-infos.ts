// Prepares per-exercise UI info for the active workout from domain data. Pure; shared by the
// workout page and the dev gallery.

import { getNextPrescription, getPreviousExercisePerformance, previousSetsInOrder } from "@/lib/progression";
import { formatMinutes, formatPrescription } from "@/lib/training/format";
import type { ResolvedDay } from "@/lib/training/schedule";
import type { WorkoutSession } from "@/lib/training/session";
import type { ExercisePerformance, ProgramBlock } from "@/lib/training/types";
import type { ExerciseInfo, WorkoutMeta } from "./types";

export function buildExerciseInfos(
  block: ProgramBlock,
  session: WorkoutSession,
  resolved: ResolvedDay,
  history: ExercisePerformance[],
): Record<string, ExerciseInfo> {
  const base = block.days.find((d) => d.dayOfWeek === resolved.dayOfWeek)!.prescriptions;
  const infos: Record<string, ExerciseInfo> = {};
  for (const e of session.exercises) {
    const exercise = block.exercises.find((x) => x.slug === e.exerciseSlug)!;
    const shown = resolved.exercises.find((p) => p.key === e.prescriptionKey)!;
    const normal = base.find((p) => p.key === e.prescriptionKey)!;
    const previous = getPreviousExercisePerformance(history, e.prescriptionKey, e.exerciseSlug);
    const rec = getNextPrescription({ exercise, prescription: normal, history, isDeloadWeek: resolved.isDeload });
    infos[e.id] = {
      workoutExerciseId: e.id,
      slug: exercise.slug,
      name: exercise.name,
      category: exercise.category,
      loadType: exercise.loadType,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      animationUrl: exercise.animationUrl,
      instructions: exercise.instructions,
      notes: shown.notes,
      prescriptionText: formatPrescription({ ...shown, sets: e.targetSets }),
      repMin: shown.repMin,
      repMax: shown.repMax,
      durationSeconds: shown.durationSeconds,
      perSide: shown.perSide,
      restSeconds: e.restSeconds,
      loadIncrement: shown.loadIncrement,
      previous: previous ? previousSetsInOrder(previous) : null,
      recommendation: { kind: rec.kind, weight: rec.recommendedWeight, reason: rec.reason },
    };
  }
  return infos;
}

export function buildWorkoutMeta(resolved: ResolvedDay): WorkoutMeta {
  return {
    dayName: resolved.day.name,
    nextScheduled: resolved.cardio
      ? `Bike · ${formatMinutes(resolved.cardio.targetMinutes, resolved.cardio.targetMinutesMax)} easy`
      : null,
  };
}
