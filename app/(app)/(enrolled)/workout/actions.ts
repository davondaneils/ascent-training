"use server";

import { serverNow } from "@/lib/clock";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/data/context";
import { startOrResumeWorkout } from "@/lib/data/workouts";
import { resolveToday } from "@/lib/training/schedule";

/** Today → Start Workout: creates today's workout on first tap, otherwise resumes it. */
export async function startWorkout() {
  const { user, supabase, program, enrollment } = await getAppContext();
  const today = resolveToday(program.block, enrollment!, await serverNow());
  if (today.status !== "active" || today.resolved.exercises.length === 0) redirect("/today");
  const id = await startOrResumeWorkout(supabase, { userId: user.id, program, resolved: today.resolved });
  redirect(`/workout/${id}`);
}
