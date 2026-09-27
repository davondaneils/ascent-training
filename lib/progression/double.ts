import type { LoggedSet } from "@/lib/training/types";
import { allSetsReachedTop, referenceWeight } from "./reference";

export interface DoubleProgressionInput {
  previousSets: LoggedSet[];
  targetSets: number;
  repMax: number;
  increment: number;
}

export interface NextWeight {
  /** Null when the previous session recorded no weight. */
  weight: number | null;
  progressed: boolean;
}

/** Same load until every working set reaches the top of the range, then add the increment. */
export function getDoubleProgressionNextWeight(input: DoubleProgressionInput): NextWeight {
  const ref = referenceWeight(input.previousSets, "higher_is_harder");
  if (ref === null) return { weight: null, progressed: false };
  const progressed = allSetsReachedTop(input.previousSets, input.targetSets, input.repMax, ref, "higher_is_harder");
  return { weight: progressed ? ref + input.increment : ref, progressed };
}
