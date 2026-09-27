"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { formatClock } from "@/lib/training/rest-timer";
import { ExerciseThumb } from "./exercise-media";
import type { ExerciseInfo } from "./types";

interface Props {
  name: string;
  summary: string;
  next: ExerciseInfo | null;
  restRemainingMs: number;
  onContinue: () => void;
  onFinish: () => void;
}

export function ExerciseComplete({ name, summary, next, restRemainingMs, onContinue, onFinish }: Props) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-1 flex-col justify-between gap-8 py-6">
      <div className="flex flex-col items-center gap-4 pt-10 text-center">
        <motion.div
          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
          className="flex size-16 items-center justify-center rounded-full bg-success text-white"
        >
          <Check className="size-8" strokeWidth={2.5} aria-hidden />
        </motion.div>
        <h2 className="text-2xl font-semibold tracking-tight">{name} complete</h2>
        <p className="text-[17px] tabular-nums text-text-secondary">{summary}</p>
        {restRemainingMs > 0 && (
          <p className="text-[15px] tabular-nums text-text-tertiary">Rest {formatClock(restRemainingMs)}</p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {next ? (
          <>
            <div className="flex items-center gap-3 rounded-[16px] bg-surface-subtle p-3">
              <ExerciseThumb info={next} />
              <div className="flex flex-col">
                <span className="text-[13px] text-text-tertiary">Next</span>
                <span className="text-[17px] font-medium">{next.name}</span>
              </div>
            </div>
            <Button size="xl" onClick={onContinue}>Continue</Button>
          </>
        ) : (
          <Button size="xl" onClick={onFinish}>Finish Workout</Button>
        )}
      </div>
    </div>
  );
}
