import type { LoggedSet } from "@/lib/training/types";
import type { NextWeight } from "./double";
import { allSetsReachedTop, referenceWeight } from "./reference";

export interface AssistanceProgressionInput {
  previousSets: LoggedSet[];
  targetSets: number;
  repMax: number;
  increment: number;
}

/**
 * Weight is assistance, so lower is harder. When every set reaches the top of the
 * range, reduce assistance by the increment, never below 0 (unassisted).
 */
export function getAssistanceProgressionNextWeight(input: AssistanceProgressionInput): NextWeight {
  const ref = referenceWeight(input.previousSets, "lower_is_harder");
  if (ref === null) return { weight: null, progressed: false };
  if (ref <= 0) return { weight: 0, progressed: false };
  const progressed = allSetsReachedTop(input.previousSets, input.targetSets, input.repMax, ref, "lower_is_harder");
  return { weight: progressed ? Math.max(0, ref - input.increment) : ref, progressed };
}
