"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SessionSet } from "@/lib/training/session";
import { RepsControl } from "./reps-control";
import type { ExerciseInfo } from "./types";
import { WeightControl } from "./weight-control";

interface Props {
  set: SessionSet | null;
  info: ExerciseInfo;
  onSave: (weight: number | null, reps: number | null) => void;
  onClose: () => void;
}

/** Fix a mistyped set. Mounted fresh per set so the fields start from the logged values. */
export function SetEditDialog({ set, info, onSave, onClose }: Props) {
  return (
    <Dialog open={set !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-[20px] sm:max-w-sm">
        {set && <EditBody key={set.id} set={set} info={info} onSave={onSave} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function EditBody({ set, info, onSave, onClose }: Props & { set: SessionSet }) {
  const [weight, setWeight] = useState(set.weight);
  const [reps, setReps] = useState(set.reps);
  const weighted = info.loadType !== "bodyweight" && info.loadType !== "none";
  const timed = info.durationSeconds !== null;
  return (
    <>
      <DialogHeader className="text-left">
        <DialogTitle>Edit set {set.setNumber}</DialogTitle>
        <DialogDescription>{info.name}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-6 py-2">
        {weighted && <WeightControl value={weight} onChange={setWeight} step={info.loadIncrement ?? 5} loadType={info.loadType} />}
        {!timed && info.repMin !== null && info.repMax !== null && (
          <RepsControl value={reps} onChange={setReps} repMin={info.repMin} repMax={info.repMax} perSide={info.perSide} />
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="touch" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button
          size="touch"
          className="flex-1"
          disabled={(!timed && reps === null) || (weighted && weight === null)}
          onClick={() => {
            onSave(weight, reps);
            onClose();
          }}
        >
          Save
        </Button>
      </div>
    </>
  );
}
