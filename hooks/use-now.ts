"use client";

import { useEffect, useState } from "react";

/**
 * Current time, re-rendered every `intervalMs` and immediately when the tab becomes visible again.
 * Null during SSR and the first client render, so server and client markup match.
 */
export function useNow(intervalMs = 250, enabled = true): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [intervalMs, enabled]);
  return now;
}
