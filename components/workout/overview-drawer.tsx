"use client";

import { ArrowRight, Check, Circle, CircleDashed, ListOrdered } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { OverviewRow } from "@/lib/training/session";
import { ExerciseThumb } from "./exercise-media";
import type { ExerciseInfo } from "./types";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./confirm-dialog";

interface Props {
  rows: OverviewRow[];
  names: Record<string, string>; // by workout exercise id
  infos: Record<string, ExerciseInfo>;
  onJump: (id: string) => void;
  onFinish: () => void;
  onDiscard: () => void;
}

const ICON = {
  complete: { Icon: Check, label: "Done", cls: "text-success" },
  current: { Icon: ArrowRight, label: "Current", cls: "text-accent" },
  partial: { Icon: CircleDashed, label: "Started", cls: "text-text-secondary" },
  not_started: { Icon: Circle, label: "Not started", cls: "text-text-tertiary" },
} as const;

export function OverviewDrawer({ rows, names, infos, onJump, onFinish, onDiscard }: Props) {
  const [open, setOpen] = useState(false);
  const allDone = rows.every((r) => r.status === "complete");
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="touch" className="-mr-2 gap-1.5 text-text-secondary">
          <ListOrdered className="size-5" aria-hidden />
          Overview
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-heading">Workout</DrawerTitle>
          <DrawerDescription>Tap an exercise to go to it. Logged sets are kept.</DrawerDescription>
        </DrawerHeader>
        <ul className="flex max-h-[60vh] flex-col overflow-y-auto px-2">
          {rows.map((r) => {
            const { Icon, label, cls } = ICON[r.status];
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    onJump(r.id);
                    setOpen(false);
                  }}
                  aria-current={r.isCurrent ? "step" : undefined}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 rounded-[14px] px-3 text-left active:bg-surface-subtle",
                    r.isCurrent && "bg-accent-soft",
                  )}
                >
                  <Icon className={cn("size-5 shrink-0", cls)} aria-label={label} />
                  {infos[r.id] && <ExerciseThumb info={infos[r.id]} className="size-10 rounded-[10px]" />}
                  <span className={cn("flex-1 text-[16px]", r.isCurrent ? "font-semibold" : "", r.status === "complete" && "text-text-secondary")}>
                    {names[r.id]}
                  </span>
                  <span className="text-[15px] tabular-nums text-text-tertiary">
                    {r.completedSets}/{r.targetSets}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          <ConfirmDialog
            title={allDone ? "Finish workout?" : "Finish early?"}
            description={allDone ? "Save this workout as complete." : "Unfinished sets won't be logged. You can't add more after finishing."}
            confirmLabel="Finish"
            onConfirm={() => {
              setOpen(false);
              onFinish();
            }}
          >
            <Button variant="secondary" size="touch" className="w-full">Finish workout</Button>
          </ConfirmDialog>
          <ConfirmDialog
            title="Discard workout?"
            description="It won't count as completed. Sets you logged stay in your history."
            confirmLabel="Discard"
            destructive
            onConfirm={() => {
              setOpen(false);
              onDiscard();
            }}
          >
            <Button variant="ghost" size="touch" className="w-full text-danger">Discard workout</Button>
          </ConfirmDialog>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
