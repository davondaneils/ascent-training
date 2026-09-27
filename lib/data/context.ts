import "server-only";
import { cache } from "react";
import { createClient, requireUser } from "@/lib/supabase/server";
import { getActiveEnrollment } from "./enrollment";
import { loadActiveProgram } from "./program";

/** Per-request app context for server components: user, program, enrollment. */
export const getAppContext = cache(async () => {
  const user = await requireUser();
  const supabase = await createClient();
  const program = await loadActiveProgram(supabase);
  const enrollment = await getActiveEnrollment(supabase, user.id, program.block.slug);
  return { user, supabase, program, enrollment };
});
