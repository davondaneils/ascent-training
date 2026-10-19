"use server";

import { revalidatePath } from "next/cache";
import { getAppContext } from "@/lib/data/context";
import { serverNow } from "@/lib/clock";
import { toLocalDate } from "@/lib/dates";
import { missionsForDate, type MissionOutcome } from "@/lib/campaign/schedule";

export async function recordMission(input: {
  date: string; missionId: string;
  status: MissionOutcome | "remove";
  evidence?: string;
}): Promise<{ error?: string }> {
  // Errors are returned, not thrown: production builds hide thrown server-action messages.
  const { user, supabase, enrollment } = await getAppContext();
  if (!enrollment) return { error: "Campaign enrollment not found." };
  const today = toLocalDate(await serverNow());
  if (input.date !== today) return { error: "Only today's missions can be recorded." };
  const mission = missionsForDate(enrollment.startDate, today)
    .find((m) => m.id === input.missionId);
  if (!mission) return { error: "Invalid mission for today." };
  if (!["completed", "needs_work", "remove"].includes(input.status))
    return { error: "Invalid mission result." };

  if (input.status === "remove") {
    const { error } = await supabase.from("mission_logs").delete().eq("user_id", user.id)
      .eq("scheduled_date", today).eq("mission_id", mission.id);
    if (error) return { error: "Could not update mission." };
  } else {
    const evidence = (input.evidence ?? "").trim();
    if (!mission.requiresEvidence && input.status === "needs_work")
      return { error: "Needs-work results apply to assessments." };
    if (mission.requiresEvidence && (evidence.length < 15 || evidence.length > 2000))
      return { error: "Describe the assessment result in at least 15 characters." };
    const { error } = await supabase.from("mission_logs").upsert({
      user_id: user.id, scheduled_date: today, mission_id: mission.id,
      status: input.status, evidence: evidence || null, completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,scheduled_date,mission_id" });
    if (error) return { error: "Could not save mission." };
  }
  revalidatePath("/today");
  revalidatePath("/progress");
  revalidatePath("/campaign");
  return {};
}
