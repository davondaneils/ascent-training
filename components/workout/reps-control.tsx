"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: number | null;
  onChange: (v: number | null) => void;
  repMin: number;
  repMax: number;
  perSide: boolean;
}

/** One-tap chips across the prescribed range, plus manual entry for anything outside it. */
export function RepsControl({ value, onChange, repMin, repMax, perSide }: Props) {
  const chips = Array.from({ length: repMax - repMin + 1 }, (_, i) => repMin + i);
  const rowRef = useRef<HTMLDivElement>(null);
  const outside = value !== null && !chips.includes(value);

  useEffect(() => {
    rowRef.current?.querySelector<HTMLElement>("[aria-pressed='true']")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span id="reps-label" className="text-[13px] font-medium text-text-tertiary">
          Reps{perSide ? " per side" : ""}
        </span>
        <label className="flex items-center gap-2 text-[13px] text-text-tertiary">
          Other
          <input
            aria-label="Reps, manual entry"
            inputMode="numeric"
            pattern="[0-9]*"
            enterKeyHint="done"
            value={outside ? String(value) : ""}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              onChange(raw === "" ? null : Math.min(99, Number(raw)));
            }}
            className={cn(
              "h-11 w-14 rounded-[12px] border border-border-subtle bg-surface text-center text-lg tabular-nums text-text-primary outline-none focus:border-focus",
              outside && "border-text-primary",
            )}
          />
        </label>
      </div>
      <div ref={rowRef} role="group" aria-labelledby="reps-label" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {chips.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(value === n ? null : n)}
            className={cn(
              "flex h-14 min-w-14 flex-1 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold tabular-nums transition-colors",
              value === n ? "bg-primary text-primary-foreground" : "bg-surface-subtle text-text-primary active:bg-border-subtle",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
