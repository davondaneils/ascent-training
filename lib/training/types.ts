// Domain types for the training program and workout sessions.
// Pure types only: no React, no Supabase. Persistence maps rows to these shapes.

/** ISO civil date, `YYYY-MM-DD`, always in the program time zone. */
export type LocalDate = string;

/** Monday = 1 … Sunday = 7 (docs/05-DATA.md). */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type SessionType = "lifting" | "aerobic_mobility" | "rest";

export type ExerciseCategory =
  | "strength"
  | "hypertrophy"
  | "mobility"
  | "cardio"
  | "core"
  | "skill-prep";

export type ProgressionType =
  | "double_progression"
  | "assistance_reduction"
  | "bodyweight_reps"
  | "none";

/** `lower_is_harder` marks assisted movements, where a smaller number is progress. */
export type LoadDirection = "higher_is_harder" | "lower_is_harder";

/** How the weight field is interpreted and labelled. */
export type LoadType =
  | "barbell"
  | "dumbbell" // stored per dumbbell
  | "machine"
  | "cable"
  | "assisted" // stored as assistance; 0 = unassisted
  | "bodyweight" // no weight input
  | "none"; // mobility / holds

/**
 * Where a prescription sits in a day:
 * - `prep`: warm-up checklist shown before exercise 1 (not counted as an exercise)
 * - `main`: focused, logged workout exercises
 * - `mobility`: Saturday checklist
 */
export type PrescriptionSection = "prep" | "main" | "mobility";

export type CardioModality = "bike" | "incline_walk";

export interface Exercise {
  slug: string;
  name: string;
  category: ExerciseCategory;
  loadType: LoadType;
  loadDirection: LoadDirection;
  imageUrl: string | null;
  videoUrl: string | null;
  animationUrl: string | null;
  instructions: string | null;
}

export interface Prescription {
  /** Stable key, e.g. `mon-bench-press`. Becomes the seeded row's natural key. */
  key: string;
  exerciseSlug: string;
  section: PrescriptionSection;
  sortOrder: number;
  sets: number;
  /** Upper bound when the program gives a set range ("1–2 × 8/side"). Display only. */
  setsMax: number | null;
  repMin: number | null;
  repMax: number | null;
  /** Lower bound of a timed hold; drives the hold timer. */
  durationSeconds: number | null;
  durationSecondsMax: number | null;
  /** Reps / time are per side or per leg. */
  perSide: boolean;
  /** Lower bound of the prescribed rest range; drives the rest timer. */
  restSeconds: number | null;
  targetRirMin: number | null;
  targetRirMax: number | null;
  progressionType: ProgressionType;
  loadIncrement: number | null;
  notes: string | null;
  isOptional: boolean;
}

export interface ProgramDay {
  dayOfWeek: DayOfWeek;
  /** Short display name used across the app (acceptance-criteria labels). */
  name: string;
  /** Full name from the training spec. */
  fullName: string;
  sessionType: SessionType;
  notes: string | null;
  prescriptions: Prescription[];
}

export interface CardioPrescription {
  weekNumber: number;
  dayOfWeek: DayOfWeek;
  modality: CardioModality;
  /** Lower bound; drives the cardio timer. */
  targetMinutes: number;
  targetMinutesMax: number | null;
  targetRpeMin: number;
  targetRpeMax: number;
  notes: string | null;
}

export interface ProgramBlock {
  slug: string;
  name: string;
  description: string;
  durationWeeks: number;
  deloadWeeks: number[];
  exercises: Exercise[];
  days: ProgramDay[];
  cardio: CardioPrescription[];
}

export interface Enrollment {
  programBlockSlug: string;
  startDate: LocalDate;
}

// ---------------------------------------------------------------------------
// Logged performance

export interface LoggedSet {
  setNumber: number;
  weight: number | null;
  reps: number | null;
}

/** One completed exposure to an exercise, used for previous performance and progression. */
export interface ExercisePerformance {
  workoutId: string;
  date: LocalDate;
  weekNumber: number;
  isDeload: boolean;
  prescriptionKey: string;
  exerciseSlug: string;
  /** Completed sets, any order; selectors sort by set number. */
  sets: LoggedSet[];
}
