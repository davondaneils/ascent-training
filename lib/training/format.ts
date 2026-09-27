import type { LoadType, LoggedSet, Prescription } from "./types";

const EN_DASH = "–";

function range(min: number | null, max: number | null): string {
  if (min === null) return "";
  return max !== null && max !== min ? `${min}${EN_DASH}${max}` : String(min);
}

/** "4 × 4–6", "1–2 × 8/side", "2 × 20–40 sec". */
export function formatPrescription(
  p: Pick<Prescription, "sets" | "setsMax" | "repMin" | "repMax" | "durationSeconds" | "durationSecondsMax" | "perSide">,
): string {
  const sets = range(p.sets, p.setsMax);
  const side = p.perSide ? "/side" : "";
  if (p.durationSeconds !== null) {
    return `${sets} × ${range(p.durationSeconds, p.durationSecondsMax)} sec${side}`;
  }
  return `${sets} × ${range(p.repMin, p.repMax)}${side}`;
}

/** 180 → "3:00", 90 → "1:30". */
export function formatRest(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** "185 × 6"; bodyweight shows reps only; assisted shows the assistance. */
export function formatSet(set: Pick<LoggedSet, "weight" | "reps">, loadType: LoadType): string {
  const reps = set.reps ?? 0;
  if (loadType === "bodyweight" || loadType === "none" || set.weight === null) return `${reps} reps`;
  if (loadType === "assisted") return set.weight === 0 ? `BW × ${reps}` : `−${set.weight} × ${reps}`;
  return `${set.weight} × ${reps}`;
}

export function formatMinutes(min: number, max: number | null): string {
  return `${range(min, max)} min`;
}

/** "185 × 6 / 6 / 5 / 5" when the load is constant, otherwise "185 × 6 · 180 × 6". */
export function formatSetsCompact(sets: Pick<LoggedSet, "weight" | "reps">[], loadType: LoadType): string {
  if (sets.length === 0) return "";
  const weights = new Set(sets.map((s) => s.weight));
  const weighted = loadType !== "bodyweight" && loadType !== "none";
  if (weighted && weights.size === 1 && sets[0].weight !== null) {
    const head = formatSet(sets[0], loadType).split(" × ")[0];
    return `${head} × ${sets.map((s) => s.reps ?? 0).join(" / ")}`;
  }
  if (!weighted || weights.size === 1) return `${sets.map((s) => s.reps ?? 0).join(" / ")} reps`;
  return sets.map((s) => formatSet(s, loadType)).join(" · ");
}

export function weightLabel(loadType: LoadType): string {
  if (loadType === "assisted") return "Assistance";
  if (loadType === "dumbbell") return "Weight (each)";
  return "Weight";
}
