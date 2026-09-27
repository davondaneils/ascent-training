import type { RecommendationKind } from "@/lib/progression";
import type { ExerciseCategory, LoadType, LoggedSet } from "@/lib/training/types";

/** Everything the active-workout UI needs about one exercise, prepared on the server. */
export interface ExerciseInfo {
  workoutExerciseId: string;
  slug: string;
  name: string;
  category: ExerciseCategory;
  loadType: LoadType;
  imageUrl: string | null;
  videoUrl: string | null;
  animationUrl: string | null;
  instructions: string | null;
  notes: string | null;
  prescriptionText: string; // "4 × 4–6"
  repMin: number | null;
  repMax: number | null;
  durationSeconds: number | null;
  perSide: boolean;
  restSeconds: number | null;
  loadIncrement: number | null;
  previous: LoggedSet[] | null;
  recommendation: { kind: RecommendationKind; weight: number | null; reason: string | null };
}

export interface WorkoutMeta {
  dayName: string;
  /** e.g. "Bike · 20 min easy", shown on the summary. */
  nextScheduled: string | null;
}
