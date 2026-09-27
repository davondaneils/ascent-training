import type { LoadDirection, LoggedSet } from "@/lib/training/types";

/** Sets that were actually performed (reps logged), in set order. */
export function completedSets(sets: LoggedSet[]): LoggedSet[] {
  return sets
    .filter((s) => s.reps !== null && s.reps > 0)
    .sort((a, b) => a.setNumber - b.setNumber);
}

/** Is `weight` at least as hard as `reference`? */
export function isAtLeastAsHard(weight: number, reference: number, direction: LoadDirection): boolean {
  return direction === "lower_is_harder" ? weight <= reference : weight >= reference;
}

/**
 * The working weight of a session: the most-used weight across completed sets,
 * ties going to the harder weight. Null if no set recorded a weight.
 */
export function referenceWeight(sets: LoggedSet[], direction: LoadDirection): number | null {
  const counts = new Map<number, number>();
  for (const s of completedSets(sets)) {
    if (s.weight === null) continue;
    counts.set(s.weight, (counts.get(s.weight) ?? 0) + 1);
  }
  let best: number | null = null;
  let bestCount = 0;
  for (const [weight, count] of counts) {
    const harder = best === null || (isAtLeastAsHard(weight, best, direction) && weight !== best);
    if (count > bestCount || (count === bestCount && harder)) {
      best = weight;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Double-progression criterion: at least `targetSets` completed sets reached `repMax`
 * at a weight at least as hard as the reference weight.
 */
export function allSetsReachedTop(
  sets: LoggedSet[],
  targetSets: number,
  repMax: number,
  reference: number,
  direction: LoadDirection,
): boolean {
  const qualifying = completedSets(sets).filter(
    (s) => s.weight !== null && (s.reps ?? 0) >= repMax && isAtLeastAsHard(s.weight, reference, direction),
  );
  return qualifying.length >= targetSets;
}
