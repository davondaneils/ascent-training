"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cardioReducer, type CardioAction, type CardioSession } from "@/lib/training/cardio";

const key = (date: string) => `ascent:cardio:${date}`;

function load(date: string): CardioSession | null {
  try {
    const raw = localStorage.getItem(key(date));
    return raw ? (JSON.parse(raw) as CardioSession) : null;
  } catch {
    return null;
  }
}

function save(s: CardioSession) {
  try {
    if (s.phase === "ready" || s.phase === "saved") localStorage.removeItem(key(s.date));
    else localStorage.setItem(key(s.date), JSON.stringify(s));
  } catch {
    // Storage unavailable: the timer still works while the page stays open.
  }
}

/** Cardio state with a local snapshot, so a reload or backgrounded tab resumes the running timer. */
export function useCardioSession(initial: CardioSession) {
  const [session, setSession] = useState(initial);
  const [restored, setRestored] = useState(false);
  const ref = useRef(initial);

  // One-time restore from localStorage after hydration (not derivable during render without a mismatch).
  // Until it has run, callers render nothing, so a stale "Start" can't be tapped and clobber a running timer.
  useEffect(() => {
    const local = load(initial.date);
    if (local && local.phase !== "saved") {
      ref.current = local;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSession(local);
    }
    setRestored(true);
  }, [initial.date]);

  const dispatch = useCallback((action: CardioAction) => {
    const next = cardioReducer(ref.current, action);
    if (next === ref.current) return next;
    ref.current = next;
    setSession(next);
    save(next);
    return next;
  }, []);

  return [session, dispatch, restored] as const;
}
