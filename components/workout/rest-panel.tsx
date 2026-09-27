"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { ProgressRing } from "@/components/shared/progress-ring";
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
    <div className="flex flex-1 flex-col items-center justify-center gap-7 py-4">
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

      <ProgressRing progress={progress}>
        <p className="type-meta tracking-wide text-text-tertiary">REST</p>
        <p className="type-timer" role="timer" aria-live="off">
          {formatClock(remainingMs)}
        </p>
      </ProgressRing>

      <div className="flex w-full gap-3">
        <Button type="button" variant="secondary" size="touch" className="h-14 flex-1 rounded-2xl text-base" onClick={onExtend}>
          +30 sec
        </Button>
        <Button type="button" variant="secondary" size="touch" className="h-14 flex-1 rounded-2xl text-base" onClick={onSkip}>
          Skip
        </Button>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="type-meta text-text-tertiary">Next set</p>
        <p className="type-subheading font-medium tabular-nums">{nextTarget}</p>
      </div>
    </div>
  );
}

