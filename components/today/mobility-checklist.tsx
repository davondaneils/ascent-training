"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, Eyebrow } from "@/components/shared/card";
import { getBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export interface ChecklistItem {
  exerciseId: string;
  name: string;
  detail: string;
  notes: string | null;
}

interface Props {
  title: string;
  date: string;
  userId: string;
  items: ChecklistItem[];
  initiallyDone: string[];
}

export function MobilityChecklist({ title, date, userId, items, initiallyDone }: Props) {
  const [done, setDone] = useState(() => new Set(initiallyDone));
  const [, startTransition] = useTransition();
  const reduce = useReducedMotion();

  function toggle(exerciseId: string) {
    const next = !done.has(exerciseId);
    setDone((s) => {
      const copy = new Set(s);
      if (next) copy.add(exerciseId);
      else copy.delete(exerciseId);
      return copy;
    });
    startTransition(async () => {
      const supabase = getBrowserClient();
      const { error } = await supabase.from("mobility_logs").upsert(
        {
          user_id: userId,
          scheduled_date: date,
          exercise_id: exerciseId,
          completed: next,
          completed_at: next ? new Date().toISOString() : null,
        },
        { onConflict: "user_id,scheduled_date,exercise_id" },
      );
      if (error) {
        toast("Couldn't save. Check your connection.");
        setDone((s) => {
          const copy = new Set(s);
          if (next) copy.delete(exerciseId);
          else copy.add(exerciseId);
          return copy;
        });
      }
    });
  }

  return (
    <Card className="flex flex-col gap-2 px-2 pb-2">
      <div className="flex items-baseline justify-between px-3 pb-1">
        <div className="flex flex-col gap-1">
          <Eyebrow>Mobility</Eyebrow>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <p className="text-[13px] tabular-nums text-text-tertiary">
          {done.size} / {items.length}
        </p>
      </div>
      <ul className="flex flex-col">
        {items.map((item) => {
          const checked = done.has(item.exerciseId);
          return (
            <li key={item.exerciseId}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(item.exerciseId)}
                className="flex min-h-14 w-full items-center gap-3 rounded-[14px] px-3 py-2 text-left transition-colors active:bg-surface-subtle"
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                    checked ? "border-success bg-success text-white" : "border-border",
                  )}
                  aria-hidden
                >
                  {checked && (
                    <motion.span
                      initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.16 }}
                    >
                      <Check className="size-4" strokeWidth={3} />
                    </motion.span>
                  )}
                </span>
                <span className="flex flex-col">
                  <span className={cn("text-[15px]", checked ? "text-text-secondary line-through decoration-text-tertiary" : "text-text-primary")}>
                    {item.name}
                  </span>
                  <span className="text-[13px] text-text-tertiary">{item.detail}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
