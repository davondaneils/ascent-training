import type { SupabaseClient } from "@supabase/supabase-js";
import type { Executor, OpResult } from "./outbox";

interface MaybeError {
  code?: string;
  message?: string;
  status?: number;
}

/** Map a PostgREST error to what the outbox should do next. */
export function classify(error: MaybeError | null, status?: number): OpResult {
  if (!error) return "ok";
  const code = error.code ?? "";
  // No HTTP response at all (offline, DNS, CORS): try again later.
  if (!code && (status === 0 || status === undefined || /fetch|network/i.test(error.message ?? ""))) return "retry";
  // Expired/missing session: anon has no grants (42501) or the JWT was rejected.
  if (code === "42501" || code === "PGRST301" || code === "PGRST303" || status === 401) return "auth";
  if (status !== undefined && status >= 500) return "retry";
  if (status === 408 || status === 429) return "retry";
  // Constraint violations and bad requests won't succeed on replay.
  return "drop";
}

export function supabaseExecutor(supabase: SupabaseClient): Executor {
  return async (op) => {
    const res =
      op.kind === "upsert_set"
        ? await supabase.from("workout_sets").upsert(op.row, { onConflict: "id" })
        : op.kind === "upsert_cardio"
          ? await supabase.from("cardio_logs").upsert(op.row, { onConflict: "id" })
          : op.kind === "update_exercise"
          ? await supabase.from("workout_exercises").update(op.patch).eq("id", op.id)
          : await supabase.from("workouts").update(op.patch).eq("id", op.id);
    const result = classify(res.error, res.status);
    if (result === "drop") console.error("Dropping unsyncable write", op, res.error);
    return result;
  };
}
