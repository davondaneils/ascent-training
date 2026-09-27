import type { SupabaseClient } from "@supabase/supabase-js";
import type { Enrollment, LocalDate } from "@/lib/training/types";

export interface LoadedEnrollment extends Enrollment {
  id: string;
}

export async function getActiveEnrollment(
  supabase: SupabaseClient,
  userId: string,
  blockSlug: string,
): Promise<LoadedEnrollment | null> {
  const { data, error } = await supabase
    .from("program_enrollments")
    .select("id, start_date")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle<{ id: string; start_date: LocalDate }>();
  if (error) throw new Error(`Loading enrollment failed: ${error.message}`);
  return data ? { id: data.id, programBlockSlug: blockSlug, startDate: data.start_date } : null;
}

export async function createEnrollment(
  supabase: SupabaseClient,
  input: { userId: string; blockId: string; startDate: LocalDate },
): Promise<void> {
  const { error } = await supabase.from("program_enrollments").insert({
    user_id: input.userId,
    program_block_id: input.blockId,
    start_date: input.startDate,
  });
  // 23505: an active enrollment already exists (double submit) — the start date is chosen once.
  if (error && error.code !== "23505") throw new Error(`Creating enrollment failed: ${error.message}`);
}
