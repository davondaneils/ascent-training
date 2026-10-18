/** Observable physical results, not a fictional combat-readiness score. */
export const BENCHMARKS = [
  { key: "run_5k_minutes", label: "5 km run", unit: "min", description: "Elapsed minutes for a continuous 5 km run", better: "lower", max: 180 },
  { key: "pullups_strict", label: "Strict pull-ups", unit: "reps", description: "Unassisted full-range pull-ups in one set", better: "higher", max: 100 },
  { key: "loaded_hike_15kg_km", label: "15 kg loaded hike", unit: "km", description: "Distance safely walked with a 15 kg pack", better: "higher", max: 100 },
  { key: "swim_continuous_m", label: "Continuous swim", unit: "m", description: "Distance swum continuously in a supervised, suitable setting", better: "higher", max: 20000 },
  { key: "carry_20kg_m", label: "20 kg carry", unit: "m", description: "Distance walked carrying 20 kg total", better: "higher", max: 20000 },
] as const;

export type BenchmarkKey = (typeof BENCHMARKS)[number]["key"];
export function getBenchmark(key: string) {
  return BENCHMARKS.find((benchmark) => benchmark.key === key) ?? null;
}
