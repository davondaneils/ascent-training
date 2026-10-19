"use server";

import { serverNow } from "@/lib/clock";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/data/context";
import { getWorkoutForDate } from "@/lib/data/today";
import { startOrResumeWorkout } from "@/lib/data/workouts";
import { resolveToday } from "@/lib/training/schedule";

/** Today → Start Workout: creates today's workout on first tap, otherwise resumes it. */
export async function startWorkout() {
  const { user, supabase, program, trainingEnrollment } = await getAppContext();
  const today = resolveToday(program.block, trainingEnrollment!, await serverNow());
  if (today.status !== "active" || today.resolved.exercises.length === 0) redirect("/today");
  // A session already under way or finished today (possibly from the previous cycle) is reopened.
  const current = await getWorkoutForDate(supabase, user.id, today.date, program.dayIds[today.resolved.dayOfWeek]);
  if (current && (current.status === "in_progress" || current.status === "completed")) redirect(`/workout/${current.id}`);
  const id = await startOrResumeWorkout(supabase, { userId: user.id, program, resolved: today.resolved });
  redirect(`/workout/${id}`);
}
