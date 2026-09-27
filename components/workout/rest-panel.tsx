"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { formatClock } from "@/lib/training/rest-timer";

interface Props {
  remainingMs: number;
  progress: number; // 0 → 1
  completedSummary: string; // "Set 1 — 185 × 6"
  nextTarget: string; // "185 lb · 4–6 reps"
  onExtend: () => void;
  onSkip: () => void;
  onEditLast: () => void;
}

export function RestPanel({ remainingMs, progress, completedSummary, nextTarget, onExtend, onSkip, onEditLast }: Props) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
      <button type="button" onClick={onEditLast} className="flex items-center gap-2 rounded-full px-3 py-2 text-[15px] text-text-secondary active:bg-surface-subtle">
        <motion.span
          initial={reduce ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex size-6 items-center justify-center rounded-full bg-success text-white"
        >
          <Check className="size-4" strokeWidth={3} aria-hidden />
        </motion.span>
        {completedSummary}
      </button>

      <div className="flex flex-col items-center gap-2">
        <p className="text-[13px] font-medium tracking-wide text-text-tertiary">REST</p>
        <p className="text-[88px] font-semibold leading-none tabular-nums tracking-tight" role="timer" aria-live="off">
          {formatClock(remainingMs)}
        </p>
        <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-surface-subtle" aria-hidden>
          <div className="h-full rounded-full bg-text-primary transition-[width] duration-300 ease-linear" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className="flex w-full gap-3">
        <Button type="button" variant="secondary" size="touch" className="h-14 flex-1 rounded-2xl text-base" onClick={onExtend}>
          +30 sec
        </Button>
        <Button type="button" variant="secondary" size="touch" className="h-14 flex-1 rounded-2xl text-base" onClick={onSkip}>
          Skip
        </Button>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-[13px] font-medium text-text-tertiary">Next set</p>
        <p className="text-lg text-text-primary">{nextTarget}</p>
      </div>
    </div>
  );
}
