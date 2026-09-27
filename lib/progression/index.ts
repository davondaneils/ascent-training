// Next-session recommendation. Pure: history in, recommended weight + short reason out.

import type { Exercise, ExercisePerformance, Prescription } from "@/lib/training/types";
import { getAssistanceProgressionNextWeight } from "./assistance";
import { getDoubleProgressionNextWeight } from "./double";
import { getProgressionSource } from "./previous";
import { referenceWeight } from "./reference";

export { getDoubleProgressionNextWeight } from "./double";
export { getAssistanceProgressionNextWeight } from "./assistance";
export {
  getPreviousExercisePerformance,
  getProgressionSource,
  previousSetsInOrder,
} from "./previous";

export type RecommendationKind =
  | "first_session"
  | "increase"
  | "same"
  | "reduce_assistance"
  | "same_assistance"
  | "unassisted"
  | "bodyweight"
  | "deload"
  | "none";

export interface Recommendation {
  kind: RecommendationKind;
  /** Load (or assistance) to pre-fill. Null when there is nothing to recommend. */
  recommendedWeight: number | null;
  /** One short line for the UI, e.g. "Up 5 lb — all sets reached 6". */
  reason: string | null;
  source: ExercisePerformance | null;
}

export interface NextPrescriptionInput {
  exercise: Exercise;
  /** The normal (non-deload) prescription; progression criteria use its set count. */
  prescription: Prescription;
  history: ExercisePerformance[];
  isDeloadWeek: boolean;
  unit?: string;
}

export function formatWeight(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

export function getNextPrescription(input: NextPrescriptionInput): Recommendation {
  const { exercise, prescription, history, isDeloadWeek } = input;
  const unit = input.unit ?? "lb";
  const type = prescription.progressionType;

  if (type === "none") {
    return { kind: "none", recommendedWeight: null, reason: null, source: null };
  }

  const source = getProgressionSource(history, prescription.key, exercise.slug);

  if (!source) {
    const reason =
      type === "assistance_reduction"
        ? "First session — find the assistance you need"
        : type === "double_progression"
          ? "First session — establish your working load"
          : null;
    return { kind: "first_session", recommendedWeight: null, reason, source: null };
  }

  if (type === "bodyweight_reps") {
    return { kind: "bodyweight", recommendedWeight: null, reason: "Beat last performance", source };
  }

  if (isDeloadWeek) {
    const weight = referenceWeight(source.sets, exercise.loadDirection);
    return { kind: "deload", recommendedWeight: weight, reason: "Deload — lighter effort, no grinders", source };
  }

  const repMax = prescription.repMax;
  const increment = prescription.loadIncrement;
  if (repMax === null || increment === null) {
    const weight = referenceWeight(source.sets, exercise.loadDirection);
    return { kind: "same", recommendedWeight: weight, reason: "Same load — beat last performance", source };
  }

  const args = { previousSets: source.sets, targetSets: prescription.sets, repMax, increment };

  if (type === "assistance_reduction") {
    const prev = referenceWeight(source.sets, "lower_is_harder");
    const next = getAssistanceProgressionNextWeight(args);
    if (prev !== null && prev <= 0) {
      return { kind: "bodyweight", recommendedWeight: 0, reason: "Bodyweight — beat last performance", source };
    }
    if (next.progressed && next.weight === 0) {
      return { kind: "unassisted", recommendedWeight: 0, reason: `No assistance — all sets reached ${repMax}`, source };
    }
    if (next.progressed && prev !== null && next.weight !== null) {
      const drop = formatWeight(prev - next.weight);
      return {
        kind: "reduce_assistance",
        recommendedWeight: next.weight,
        reason: `${drop} ${unit} less assistance — all sets reached ${repMax}`,
        source,
      };
    }
    return { kind: "same_assistance", recommendedWeight: next.weight, reason: "Same assistance — beat last performance", source };
  }

  const next = getDoubleProgressionNextWeight(args);
  if (next.progressed) {
    return {
      kind: "increase",
      recommendedWeight: next.weight,
      reason: `Up ${formatWeight(increment)} ${unit} — all sets reached ${repMax}`,
      source,
    };
  }
  return { kind: "same", recommendedWeight: next.weight, reason: "Same load — beat last performance", source };
}
