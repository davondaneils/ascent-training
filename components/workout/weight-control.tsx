"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWeight } from "@/lib/progression";
import { weightLabel } from "@/lib/training/format";
import type { LoadType } from "@/lib/training/types";

interface Props {
  value: number | null;
  onChange: (v: number | null) => void;
  step: number;
  loadType: LoadType;
}

export function WeightControl({ value, onChange, step, loadType }: Props) {
  const bump = (dir: 1 | -1) => {
    const next = Math.max(0, (value ?? 0) + dir * step);
    onChange(Number(next.toFixed(2)));
  };
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="weight" className="text-meta text-text-tertiary">
        {weightLabel(loadType)}
      </label>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="icon-touch" className="size-14 rounded-2xl border-border-subtle bg-surface" onClick={() => bump(-1)} aria-label={`Decrease by ${step}`}>
          <Minus className="size-6" />
        </Button>
        <div className="flex flex-1 items-baseline justify-center gap-1.5">
          <input
            id="weight"
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            value={value === null ? "" : formatWeight(value)}
            placeholder="—"
            onChange={(e) => {
              const raw = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
              if (raw === "") return onChange(null);
              const n = Number(raw);
              if (Number.isFinite(n)) onChange(n);
            }}
            onFocus={(e) => e.currentTarget.select()}
            className="w-32 bg-transparent text-center text-display text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <span className="text-lg text-text-secondary">lb</span>
        </div>
        <Button type="button" variant="outline" size="icon-touch" className="size-14 rounded-2xl border-border-subtle bg-surface" onClick={() => bump(1)} aria-label={`Increase by ${step}`}>
          <Plus className="size-6" />
        </Button>
      </div>
      {loadType === "assisted" && <p className="text-center text-[13px] text-text-tertiary">0 = no assistance</p>}
    </div>
  );
}
