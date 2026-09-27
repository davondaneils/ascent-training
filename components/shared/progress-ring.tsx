"use client";

import { motion } from "motion/react";

interface Props {
  /** 0 → 1 */
  progress: number;
  radius?: number;
  stroke?: number;
  children: React.ReactNode;
}

/** Accent ring that fills with progress. Driven by timestamp-derived values, never a counter. */
export function ProgressRing({ progress, radius = 118, stroke = 6, children }: Props) {
  const size = (radius + stroke) * 2;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-subtle)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: Math.min(1, Math.max(0.001, progress)) }}
          transition={{ duration: 0.25, ease: "linear" }}
        />
      </svg>
      <div className="flex flex-col items-center gap-1">{children}</div>
    </div>
  );
}
