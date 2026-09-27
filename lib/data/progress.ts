// Scoped history queries for the Progress screen: key lifts, cardio logs, completed workout dates.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardioLogPoint } from "@/lib/training/metrics";
import type { ExercisePerformance, LocalDate } from "@/lib/training/types";
import type { LoadedProgram } from "./program";
import { loadExerciseHistory } from "./workouts";

/** Exercises the Progress screen charts. */
export const STRENGTH_LIFTS = ["bench-press", "paused-bench-press", "leg-press", "romanian-deadlift", "hack-squat"] as const;
export const RELATIVE_LIFTS = { "pull-up": ["pull-up", "strict-pull-up"], dip: ["dip"] } as const;

const NO_WORKOUT = "00000000-0000-0000-0000-000000000000";

export interface ProgressData {
  lifts: ExercisePerformance[];
  cardio: CardioLogPoint[];
  completedLiftingDates: LocalDate[];
}

export async function loadProgressData(
  supabase: SupabaseClient,
  program: LoadedProgram,
  userId: string,
): Promise<ProgressData> {
  const slugs = [...STRENGTH_LIFTS, ...RELATIVE_LIFTS["pull-up"], ...RELATIVE_LIFTS.dip];
  const [lifts, cardio, workouts] = await Promise.all([
    loadExerciseHistory(supabase, program, {
      userId,
      exerciseIds: slugs.map((s) => program.exerciseIds[s]).filter(Boolean),
      excludeWorkoutId: NO_WORKOUT,
      limit: 3000,
    }),
    supabase
      .from("cardio_logs")
      .select("scheduled_date, actual_minutes, rpe")
      .eq("user_id", userId)
      .order("scheduled_date")
      .returns<{ scheduled_date: LocalDate; actual_minutes: number; rpe: number }[]>(),
    supabase
      .from("workouts")
      .select("scheduled_date")
      .eq("user_id", userId)
      .eq("status", "completed")
      .returns<{ scheduled_date: LocalDate }[]>(),
  ]);
  if (cardio.error) throw new Error(`Loading cardio failed: ${cardio.error.message}`);
  if (workouts.error) throw new Error(`Loading workouts failed: ${workouts.error.message}`);

  return {
    lifts,
    cardio: (cardio.data ?? []).map((r) => ({ date: r.scheduled_date, actualMinutes: r.actual_minutes, rpe: r.rpe })),
    completedLiftingDates: (workouts.data ?? []).map((w) => w.scheduled_date),
  };
}
