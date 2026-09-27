"use server";

import { serverNow } from "@/lib/clock";
import { redirect } from "next/navigation";
import { addDays, toLocalDate } from "@/lib/dates";
import { getAppContext } from "@/lib/data/context";
import { createEnrollment } from "@/lib/data/enrollment";

export async function startProgram(_prev: string | null, form: FormData): Promise<string | null> {
  const startDate = String(form.get("startDate") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return "Pick a start date.";
  const today = toLocalDate(await serverNow());
  if (startDate < addDays(today, -84) || startDate > addDays(today, 60)) return "Pick a date closer to today.";

  const { user, supabase, program, enrollment } = await getAppContext();
  if (!enrollment) {
    await createEnrollment(supabase, { userId: user.id, blockId: program.blockId, startDate });
  }
  redirect("/today");
}
