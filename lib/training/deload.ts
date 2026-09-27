// Deload rules (docs/02-TRAINING.md "Deload rule"), made concrete:
// - working sets drop to ~55% of normal, rounded, minimum 1 (4→2, 3→2, 2→1);
// - cardio drops ~35%, rounded to the nearest 5 minutes, minimum 5.
// Loads are not recalculated here; progression handles deload recommendations.

import type { Prescription, ProgramBlock } from "./types";

export const DELOAD_SET_FACTOR = 0.55;
export const DELOAD_CARDIO_FACTOR = 0.65;

export function isDeloadWeek(block: Pick<ProgramBlock, "deloadWeeks">, week: number): boolean {
  return block.deloadWeeks.includes(week);
}

export function deloadSets(sets: number): number {
  return Math.max(1, Math.round(sets * DELOAD_SET_FACTOR));
}

export function deloadMinutes(minutes: number): number {
  return Math.max(5, Math.round((minutes * DELOAD_CARDIO_FACTOR) / 5) * 5);
}

/** Only logged working sets are reduced; prep and mobility checklists stay as written. */
export function applyDeload(prescription: Prescription): Prescription {
  if (prescription.section !== "main") return prescription;
  return { ...prescription, sets: deloadSets(prescription.sets), setsMax: null };
}
