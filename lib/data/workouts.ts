// Workout persistence (server side): create/resume, load, and exercise history.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResolvedDay } from "@/lib/training/schedule";
import type { SessionExercise, SessionStatus, WorkoutSession } from "@/lib/training/session";
import type { ExercisePerformance, LocalDate } from "@/lib/training/types";
import type { LoadedProgram } from "./program";

export interface WorkoutRow {
  id: string;
  program_day_id: string;
  week_number: number;
  scheduled_date: LocalDate;
  started_at: string | null;
  completed_at: string | null;
  status: "scheduled" | SessionStatus;
}

interface WorkoutExerciseRow {
  id: string;
  exercise_id: string;
  prescription_id: string;
  planned_order: number;
  actual_order: number | null;
  target_sets: number;
  rest_seconds: number | null;
  completed_at: string | null;
}

interface SetRow {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight: number | string | null;
  reps: number | null;
  completed_at: string | null;
}

const ms = (iso: string | null): number | null => (iso ? Date.parse(iso) : null);
const num = (v: number | string | null): number | null => (v === null ? null : Number(v));

/** Returns today's workout id, creating it (and its exercises) on first start. */
export async function startOrResumeWorkout(
  supabase: SupabaseClient,
  input: { userId: string; program: LoadedProgram; resolved: ResolvedDay },
): Promise<string> {
  const { userId, program, resolved } = input;
  const dayId = program.dayIds[resolved.dayOfWeek];

  const existing = await supabase
    .from("workouts")
    .select("id, status")
    .eq("user_id", userId)
    .eq("scheduled_date", resolved.date)
    .eq("program_day_id", dayId)
    .maybeSingle<{ id: string; status: WorkoutRow["status"] }>();
  if (existing.error) throw new Error(`Loading workout failed: ${existing.error.message}`);

  if (existing.data) {
    if (existing.data.status === "scheduled" || existing.data.status === "abandoned") {
      const { error } = await supabase
        .from("workouts")
        .update({ status: "in_progress", started_at: new Date().toISOString(), completed_at: null })
        .eq("id", existing.data.id);
      if (error) throw new Error(`Resuming workout failed: ${error.message}`);
    }
    return existing.data.id;
  }

  const id = crypto.randomUUID();
  const { error } = await supabase.from("workouts").insert({
    id,
    user_id: userId,
    program_block_id: program.blockId,
    program_day_id: dayId,
    week_number: resolved.week,
    scheduled_date: resolved.date,
    started_at: new Date().toISOString(),
    status: "in_progress",
  });
  if (error) {
    // Started concurrently on another device/tab: use that one.
    if (error.code === "23505") return startOrResumeWorkout(supabase, input);
    throw new Error(`Creating workout failed: ${error.message}`);
  }

  const rows = resolved.exercises.map((p, i) => ({
    id: crypto.randomUUID(),
    workout_id: id,
    exercise_id: program.exerciseIds[p.exerciseSlug],
    prescription_id: program.prescriptionIds[p.key],
    planned_order: i + 1,
    target_sets: p.sets, // deload already applied
    rest_seconds: p.restSeconds,
    status: "pending",
  }));
  const ex = await supabase.from("workout_exercises").insert(rows);
  if (ex.error) throw new Error(`Creating workout exercises failed: ${ex.error.message}`);
  return id;
}

export interface LoadedWorkout {
  workout: WorkoutRow;
  session: WorkoutSession;
}

export async function loadWorkout(
  supabase: SupabaseClient,
  program: LoadedProgram,
  workoutId: string,
): Promise<LoadedWorkout | null> {
  const [w, ex, sets] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, program_day_id, week_number, scheduled_date, started_at, completed_at, status")
      .eq("id", workoutId)
      .maybeSingle<WorkoutRow>(),
    supabase
      .from("workout_exercises")
      .select("id, exercise_id, prescription_id, planned_order, actual_order, target_sets, rest_seconds, completed_at")
      .eq("workout_id", workoutId)
      .order("planned_order")
      .returns<WorkoutExerciseRow[]>(),
    supabase
      .from("workout_sets")
      .select("id, workout_exercise_id, set_number, weight, reps, completed_at")
      .eq("workout_id", workoutId)
      .order("set_number")
      .returns<SetRow[]>(),
  ]);
  if (w.error) throw new Error(`Loading workout failed: ${w.error.message}`);
  if (!w.data) return null;
  if (ex.error) throw new Error(`Loading workout exercises failed: ${ex.error.message}`);
  if (sets.error) throw new Error(`Loading sets failed: ${sets.error.message}`);

  const exercises: SessionExercise[] = (ex.data ?? []).map((e) => {
    const mine = (sets.data ?? []).filter((s) => s.workout_exercise_id === e.id);
    return {
      id: e.id,
      prescriptionKey: program.prescriptionKeysById[e.prescription_id],
      exerciseSlug: program.exerciseSlugsById[e.exercise_id],
      plannedOrder: e.planned_order,
      actualOrder: e.actual_order,
      targetSets: e.target_sets,
      restSeconds: e.rest_seconds,
      sets: mine.map((s) => ({
        id: s.id,
        setNumber: s.set_number,
        weight: num(s.weight),
        reps: s.reps,
        completedAt: ms(s.completed_at) ?? 0,
      })),
      completedAt: ms(e.completed_at),
    };
  });

  if (exercises.length === 0) return null;
  const current = exercises.find((e) => e.sets.length < e.targetSets) ?? exercises[exercises.length - 1];
  const status: SessionStatus = w.data.status === "scheduled" ? "in_progress" : w.data.status;

  return {
    workout: w.data,
    session: {
      workoutId: w.data.id,
      status,
      startedAt: ms(w.data.started_at) ?? Date.now(),
      completedAt: ms(w.data.completed_at),
      exercises,
      currentExerciseId: current.id,
      rest: null,
    },
  };
}

interface HistoryRow {
  workout_exercise_id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  weight: number | string | null;
  reps: number | null;
  workout_exercises: { prescription_id: string } | null;
  workouts: { scheduled_date: LocalDate; week_number: number } | null;
}

/** Recent completed exposures to the given exercises, excluding one workout. Scoped, not full history. */
export async function loadExerciseHistory(
  supabase: SupabaseClient,
  program: LoadedProgram,
  input: { userId: string; exerciseIds: string[]; excludeWorkoutId: string; limit?: number },
): Promise<ExercisePerformance[]> {
  if (input.exerciseIds.length === 0) return [];
  const { data, error } = await supabase
    .from("workout_sets")
    .select("workout_exercise_id, workout_id, exercise_id, set_number, weight, reps, workout_exercises(prescription_id), workouts(scheduled_date, week_number)")
    .eq("user_id", input.userId)
    .in("exercise_id", input.exerciseIds)
    .neq("workout_id", input.excludeWorkoutId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(input.limit ?? 400)
    .returns<HistoryRow[]>();
  if (error) throw new Error(`Loading history failed: ${error.message}`);

  const groups = new Map<string, ExercisePerformance>();
  for (const r of data ?? []) {
    if (!r.workouts || !r.workout_exercises) continue;
    let g = groups.get(r.workout_exercise_id);
    if (!g) {
      g = {
        workoutId: r.workout_id,
        date: r.workouts.scheduled_date,
        weekNumber: r.workouts.week_number,
        isDeload: program.block.deloadWeeks.includes(r.workouts.week_number),
        prescriptionKey: program.prescriptionKeysById[r.workout_exercises.prescription_id],
        exerciseSlug: program.exerciseSlugsById[r.exercise_id],
        sets: [],
      };
      groups.set(r.workout_exercise_id, g);
    }
    g.sets.push({ setNumber: r.set_number, weight: num(r.weight), reps: r.reps });
  }
  return [...groups.values()];
}
