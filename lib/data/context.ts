import "server-only";
import { cache } from "react";
import { serverNow } from "@/lib/clock";
import { toLocalDate } from "@/lib/dates";
import { physicalBlockForDate } from "@/lib/training/programs/readiness";
import type { Enrollment } from "@/lib/training/types";
import { createClient, requireUser } from "@/lib/supabase/server";
import { getActiveEnrollment } from "./enrollment";
import { loadActiveProgram, loadProgramBySlug } from "./program";

/**
 * Enrollment date is the immutable five-year campaign anchor. Each physical
 * block uses a derived 13-week date clock, not a new enrollment row.
 */
export const getAppContext = cache(async () => {
  const user = await requireUser();
  const supabase = await createClient();
  const enrollment = await getActiveEnrollment(supabase, user.id, "phase-1-foundation");
  if (!enrollment) {
    const program = await loadActiveProgram(supabase);
    return { user, supabase, program, enrollment, trainingEnrollment: null as Enrollment | null };
  }
  const physical = physicalBlockForDate(enrollment.startDate, toLocalDate(await serverNow()));
  const program = await loadProgramBySlug(supabase, physical.blockSlug);
  const trainingEnrollment: Enrollment = {
    programBlockSlug: physical.blockSlug, startDate: physical.startDate,
  };
  return { user, supabase, program, enrollment, trainingEnrollment };
});
