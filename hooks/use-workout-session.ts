"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getOutbox } from "@/lib/offline/client-outbox";
import { clearLocalSession, loadLocalSession, saveLocalSession } from "@/lib/offline/local-session";
import { mergeSession } from "@/lib/offline/merge";
import { opsForAction, type OpsContext } from "@/lib/offline/session-ops";
import { sessionReducer, type SessionAction, type WorkoutSession } from "@/lib/training/session";

/**
 * Active workout state: the pure reducer, mirrored to a local snapshot (reload recovery)
 * and to the outbox (cloud sync). Writes are optimistic and never block the UI.
 */
export function useWorkoutSession(initial: WorkoutSession, ctx: OpsContext) {
  const [session, setSession] = useState(initial);
  const ref = useRef(initial);
  const ctxRef = useRef(ctx);

  // Recover unsynced local state after a reload (client only, after hydration).
  useEffect(() => {
    const merged = mergeSession(initial, loadLocalSession(initial.workoutId));
    if (merged !== ref.current) {
      ref.current = merged;
      setSession(merged);
    }
  }, [initial]);

  useEffect(() => {
    if (session.status === "in_progress") saveLocalSession(session);
    else clearLocalSession(session.workoutId);
  }, [session]);

  const dispatch = useCallback((action: SessionAction) => {
    const prev = ref.current;
    const next = sessionReducer(prev, action);
    if (next === prev) return;
    ref.current = next;
    setSession(next);
    const ops = opsForAction(prev, next, action, ctxRef.current);
    if (ops.length > 0) {
      const box = getOutbox();
      for (const op of ops) box.enqueue(op);
      void box.flush();
    }
  }, []);

  return [session, dispatch] as const;
}
