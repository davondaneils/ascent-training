// Queries for the Today screen. Scoped to one date or one program week; never full history.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { LocalDate } from "@/lib/training/types";

export type WorkoutStatus = "scheduled" | "in_progress" | "completed" | "abandoned";

export async function getWorkoutForDate(
  supabase: SupabaseClient,
  userId: string,
  date: LocalDate,
  programDayId: string,
): Promise<{ id: string; status: WorkoutStatus } | null> {
  const { data, error } = await supabase
    .from("workouts")
    .select("id, status")
    .eq("user_id", userId)
    .eq("scheduled_date", date)
    .eq("program_day_id", programDayId)
    .maybeSingle<{ id: string; status: WorkoutStatus }>();
  if (error) throw new Error(`Loading workout failed: ${error.message}`);
  return data;
}

export interface CardioLogSummary {
  id: string;
  actualMinutes: number;
  rpe: number;
}

export async function getCardioLogsForDate(
  supabase: SupabaseClient,
  userId: string,
  date: LocalDate,
): Promise<CardioLogSummary[]> {
  const { data, error } = await supabase
    .from("cardio_logs")
    .select("id, actual_minutes, rpe")
    .eq("user_id", userId)
    .eq("scheduled_date", date)
    .returns<{ id: string; actual_minutes: number; rpe: number }[]>();
  if (error) throw new Error(`Loading cardio failed: ${error.message}`);
  return (data ?? []).map((r) => ({ id: r.id, actualMinutes: r.actual_minutes, rpe: r.rpe }));
}

/** Exercise ids checked off on a date (Saturday mobility, lifting-day prep). */
export async function getMobilityDoneForDate(
  supabase: SupabaseClient,
  userId: string,
  date: LocalDate,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("mobility_logs")
    .select("exercise_id")
    .eq("user_id", userId)
    .eq("scheduled_date", date)
    .eq("completed", true)
    .returns<{ exercise_id: string }[]>();
  if (error) throw new Error(`Loading mobility failed: ${error.message}`);
  return new Set((data ?? []).map((r) => r.exercise_id));
}

/** Completed lifting sessions and cardio days within [from, to]. */
export async function getWeekCompletion(
  supabase: SupabaseClient,
  userId: string,
  from: LocalDate,
  to: LocalDate,
): Promise<{ lifting: number; cardio: number }> {
  const [workouts, cardio] = await Promise.all([
    supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("scheduled_date", from)
      .lte("scheduled_date", to),
    supabase
      .from("cardio_logs")
      .select("scheduled_date")
      .eq("user_id", userId)
      .gte("scheduled_date", from)
      .lte("scheduled_date", to)
      .returns<{ scheduled_date: string }[]>(),
  ]);
  if (workouts.error) throw new Error(`Loading week failed: ${workouts.error.message}`);
  if (cardio.error) throw new Error(`Loading week failed: ${cardio.error.message}`);
  return {
    lifting: workouts.count ?? 0,
    cardio: new Set((cardio.data ?? []).map((r) => r.scheduled_date)).size,
  };
}
