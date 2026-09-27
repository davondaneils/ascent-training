"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import { formatClock, remainingMs, startRest, type RestTimer } from "@/lib/training/rest-timer";

/** Optional countdown for timed holds. Timestamp-based like the rest timer. */
export function HoldTimer({ seconds, perSide }: { seconds: number; perSide: boolean }) {
  const [timer, setTimer] = useState<RestTimer | null>(null);
  const now = useNow(250, timer !== null);
  const left = timer ? remainingMs(timer, now) : seconds * 1000;
  const running = timer !== null && left > 0;

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <p className="text-6xl font-semibold tabular-nums tracking-tight" aria-live="polite">
        {formatClock(left)}
      </p>
      <p className="text-[13px] text-text-tertiary">
        {timer && left === 0 ? "Hold complete" : `${seconds} sec${perSide ? " per side" : ""}`}
      </p>
      <Button
        type="button"
        variant="secondary"
        size="touch"
        onClick={() => setTimer(running ? null : startRest(Date.now(), seconds))}
      >
        {running ? "Reset" : timer ? "Again" : `Start ${seconds} sec`}
      </Button>
    </div>
  );
}
