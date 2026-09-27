// Phase 1 — Foundation, transcribed from docs/02-TRAINING.md.
// This is the single source for the seed; the app reads the seeded rows at runtime.
//
// Where the spec gives a range and the schema needs one number, the lower bound is the
// actionable value (timer / rest) and the upper bound is kept for display.

import { deloadMinutes } from "../deload";
import { mediaUrls } from "./media-map";
import type {
  CardioPrescription,
  DayOfWeek,
  Exercise,
  ExerciseCategory,
  LoadType,
  Prescription,
  ProgramBlock,
  ProgramDay,
} from "../types";

// ---------------------------------------------------------------------------
// Exercises

function exercise(
  slug: string,
  name: string,
  category: ExerciseCategory,
  loadType: LoadType,
): Exercise {
  return {
    slug,
    name,
    category,
    loadType,
    loadDirection: loadType === "assisted" ? "lower_is_harder" : "higher_is_harder",
    ...mediaUrls(slug),
    videoUrl: null,
    instructions: null,
  };
}

const EXERCISES: Exercise[] = [
  // Upper
  exercise("bench-press", "Barbell Bench Press", "strength", "barbell"),
  exercise("paused-bench-press", "Paused Bench Press", "strength", "barbell"),
  exercise("pull-up", "Pull-Up / Assisted Pull-Up", "strength", "assisted"),
  exercise("strict-pull-up", "Strict Pull-Up", "strength", "assisted"),
  exercise("dip", "Dip / Assisted Dip", "strength", "assisted"),
  exercise("incline-db-press", "Incline Dumbbell Press", "hypertrophy", "dumbbell"),
  exercise("chest-supported-row", "Chest-Supported Row", "hypertrophy", "machine"),
  exercise("lat-pulldown", "Lat Pulldown", "hypertrophy", "cable"),
  exercise("seated-cable-row", "Seated Cable Row", "hypertrophy", "cable"),
  exercise("half-kneeling-landmine-press", "Half-Kneeling Landmine Press", "strength", "barbell"),
  exercise("lateral-raise", "Lateral Raise", "hypertrophy", "dumbbell"),
  exercise("cable-lateral-raise", "Cable Lateral Raise", "hypertrophy", "cable"),
  exercise("reverse-pec-deck", "Reverse Pec Deck", "hypertrophy", "machine"),
  exercise("rear-delt-fly", "Rear-Delt Fly", "hypertrophy", "dumbbell"),
  exercise("overhead-cable-triceps-extension", "Overhead Cable Triceps Extension", "hypertrophy", "cable"),
  exercise("triceps-pressdown", "Triceps Pressdown", "hypertrophy", "cable"),
  exercise("incline-db-curl", "Incline Dumbbell Curl", "hypertrophy", "dumbbell"),
  exercise("preacher-curl", "Preacher Curl", "hypertrophy", "machine"),
  exercise("hammer-curl", "Hammer Curl", "hypertrophy", "dumbbell"),
  exercise("scapular-pull-up", "Scapular Pull-Up", "skill-prep", "bodyweight"),
  exercise("dead-hang", "Comfortable Dead Hang", "skill-prep", "none"),
  // Lower
  exercise("heel-elevated-goblet-squat", "Heel-Elevated Goblet Squat", "skill-prep", "dumbbell"),
  exercise("leg-press", "Leg Press", "strength", "machine"),
  exercise("romanian-deadlift", "Romanian Deadlift", "strength", "barbell"),
  exercise("reverse-lunge", "Reverse Lunge", "hypertrophy", "dumbbell"),
  exercise("seated-calf-raise", "Seated Calf Raise", "hypertrophy", "machine"),
  exercise("tibialis-raise", "Tibialis Raise", "hypertrophy", "bodyweight"),
  exercise("hack-squat", "Hack Squat / Pendulum Squat", "hypertrophy", "machine"),
  exercise("bulgarian-split-squat", "Bulgarian Split Squat", "hypertrophy", "dumbbell"),
  exercise("leg-curl", "Seated or Lying Leg Curl", "hypertrophy", "machine"),
  exercise("hip-thrust", "Hip Thrust", "hypertrophy", "barbell"),
  exercise("leg-extension", "Leg Extension", "hypertrophy", "machine"),
  exercise("standing-calf-raise", "Standing Calf Raise", "hypertrophy", "machine"),
  exercise("back-extension", "Back Extension", "hypertrophy", "bodyweight"),
  // Core
  exercise("dead-bug", "Dead Bug", "core", "bodyweight"),
  exercise("pallof-press", "Pallof Press", "core", "cable"),
  // Mobility
  exercise("knee-to-wall", "Knee-to-Wall Ankle Mobilization", "mobility", "none"),
  exercise("supported-deep-squat", "Supported Deep Squat", "mobility", "none"),
  exercise("90-90-hip-switch", "90/90 Hip Switch", "mobility", "none"),
  exercise("90-90-hip-rotation", "90/90 Hip Rotation", "mobility", "none"),
  exercise("adductor-rockback", "Adductor Rockback", "mobility", "none"),
  exercise("thoracic-extension", "Thoracic Extension", "mobility", "none"),
  exercise("bench-lat-stretch", "Bench Lat / Shoulder-Flexion Stretch", "mobility", "none"),
  exercise("wall-slide", "Wall Slide", "mobility", "none"),
  exercise("split-stance-hold", "Stable Split-Stance Hold", "mobility", "none"),
];

// ---------------------------------------------------------------------------
// Prescriptions

const REST = { primary: 180, compound: 120, ninety: 90, accessory: 60 } as const;

type Rir = readonly [number, number] | null;

interface LiftOpts {
  sets: number;
  reps: readonly [number, number];
  rest: number;
  rir: Rir;
  increment?: number | null;
  progression?: Prescription["progressionType"];
  perSide?: boolean;
  notes?: string;
}

function lift(key: string, exerciseSlug: string, o: LiftOpts): Omit<Prescription, "sortOrder"> {
  return {
    key,
    exerciseSlug,
    section: "main",
    sets: o.sets,
    setsMax: null,
    repMin: o.reps[0],
    repMax: o.reps[1],
    durationSeconds: null,
    durationSecondsMax: null,
    perSide: o.perSide ?? false,
    restSeconds: o.rest,
    targetRirMin: o.rir?.[0] ?? null,
    targetRirMax: o.rir?.[1] ?? null,
    progressionType: o.progression ?? "double_progression",
    loadIncrement: o.progression === "bodyweight_reps" ? null : (o.increment ?? 5),
    notes: o.notes ?? null,
    isOptional: false,
  };
}

interface ItemOpts {
  sets: number;
  setsMax?: number;
  reps?: readonly [number, number];
  seconds?: readonly [number, number];
  perSide?: boolean;
  rest?: number;
  notes?: string;
}

/** Checklist items (prep / mobility) and timed holds. Not load-progressed. */
function item(
  key: string,
  exerciseSlug: string,
  section: Prescription["section"],
  o: ItemOpts,
): Omit<Prescription, "sortOrder"> {
  return {
    key,
    exerciseSlug,
    section,
    sets: o.sets,
    setsMax: o.setsMax ?? null,
    repMin: o.reps?.[0] ?? null,
    repMax: o.reps?.[1] ?? null,
    durationSeconds: o.seconds?.[0] ?? null,
    durationSecondsMax: o.seconds && o.seconds[1] !== o.seconds[0] ? o.seconds[1] : null,
    perSide: o.perSide ?? false,
    restSeconds: o.rest ?? null,
    targetRirMin: null,
    targetRirMax: null,
    progressionType: "none",
    loadIncrement: null,
    notes: o.notes ?? null,
    isOptional: false,
  };
}

function day(
  dayOfWeek: DayOfWeek,
  name: string,
  fullName: string,
  sessionType: ProgramDay["sessionType"],
  notes: string | null,
  prescriptions: Omit<Prescription, "sortOrder">[],
): ProgramDay {
  return {
    dayOfWeek,
    name,
    fullName,
    sessionType,
    notes,
    prescriptions: prescriptions.map((p, i) => ({ ...p, sortOrder: i + 1 })),
  };
}

const MONDAY = day(1, "Upper Strength", "Upper Strength", "lifting", null, [
  lift("mon-bench-press", "bench-press", { sets: 4, reps: [4, 6], rest: REST.primary, rir: [2, 2] }),
  lift("mon-pull-up", "pull-up", {
    sets: 4, reps: [5, 8], rest: REST.compound, rir: [2, 2], progression: "assistance_reduction",
    notes: "Log assistance. Enter 0 when unassisted.",
  }),
  lift("mon-incline-db-press", "incline-db-press", { sets: 3, reps: [6, 10], rest: REST.compound, rir: [2, 2] }),
  lift("mon-chest-supported-row", "chest-supported-row", { sets: 3, reps: [6, 10], rest: REST.compound, rir: [2, 2] }),
  lift("mon-lateral-raise", "lateral-raise", { sets: 3, reps: [12, 20], rest: REST.accessory, rir: [1, 2] }),
  lift("mon-overhead-triceps", "overhead-cable-triceps-extension", { sets: 2, reps: [10, 15], rest: REST.accessory, rir: [1, 2] }),
  lift("mon-incline-db-curl", "incline-db-curl", { sets: 2, reps: [10, 15], rest: REST.accessory, rir: [1, 2] }),
]);

const TUESDAY = day(2, "Lower Strength + Movement", "Lower Strength + Movement Foundation", "lifting", null, [
  item("tue-prep-knee-to-wall", "knee-to-wall", "prep", { sets: 1, setsMax: 2, reps: [8, 8], perSide: true }),
  item("tue-prep-deep-squat", "supported-deep-squat", "prep", { sets: 2, seconds: [20, 30] }),
  item("tue-prep-90-90", "90-90-hip-switch", "prep", { sets: 1, reps: [6, 6], perSide: true }),
  item("tue-prep-adductor-rockback", "adductor-rockback", "prep", { sets: 1, reps: [8, 8], perSide: true }),
  lift("tue-goblet-squat", "heel-elevated-goblet-squat", {
    sets: 2, reps: [8, 10], rest: REST.ninety, rir: [3, 4],
    notes: "Movement practice, not the main strength stimulus.",
  }),
  lift("tue-leg-press", "leg-press", { sets: 4, reps: [5, 8], rest: REST.primary, rir: [2, 2], increment: 10 }),
  lift("tue-rdl", "romanian-deadlift", { sets: 3, reps: [6, 8], rest: REST.compound, rir: [2, 2] }),
  lift("tue-reverse-lunge", "reverse-lunge", { sets: 2, reps: [8, 10], rest: REST.compound, rir: [2, 2], perSide: true }),
  lift("tue-seated-calf-raise", "seated-calf-raise", { sets: 3, reps: [8, 12], rest: REST.ninety, rir: [1, 2] }),
  lift("tue-tibialis-raise", "tibialis-raise", { sets: 2, reps: [12, 20], rest: REST.accessory, rir: [1, 2], progression: "bodyweight_reps" }),
  lift("tue-dead-bug", "dead-bug", {
    sets: 2, reps: [8, 12], rest: REST.accessory, rir: null, progression: "bodyweight_reps", perSide: true,
    notes: "Controlled.",
  }),
]);

const WEDNESDAY = day(3, "Upper Hypertrophy", "Upper Hypertrophy", "lifting", null, [
  lift("wed-paused-bench-press", "paused-bench-press", {
    sets: 3, reps: [6, 8], rest: REST.primary, rir: [2, 3], notes: "1-second pause on chest.",
  }),
  lift("wed-lat-pulldown", "lat-pulldown", { sets: 3, reps: [8, 12], rest: REST.compound, rir: [1, 2] }),
  lift("wed-incline-db-press", "incline-db-press", { sets: 3, reps: [8, 12], rest: REST.compound, rir: [1, 2] }),
  lift("wed-seated-cable-row", "seated-cable-row", { sets: 3, reps: [8, 12], rest: REST.compound, rir: [1, 2] }),
  lift("wed-cable-lateral-raise", "cable-lateral-raise", {
    sets: 3, reps: [12, 20], rest: REST.accessory, rir: [1, 2],
    notes: "If cable laterals cause pain, use a dumbbell or machine lateral raise.",
  }),
  lift("wed-reverse-pec-deck", "reverse-pec-deck", { sets: 2, reps: [12, 20], rest: REST.accessory, rir: [1, 2] }),
  lift("wed-preacher-curl", "preacher-curl", { sets: 2, reps: [8, 12], rest: REST.accessory, rir: [1, 2] }),
  lift("wed-triceps-pressdown", "triceps-pressdown", { sets: 2, reps: [10, 15], rest: REST.accessory, rir: [1, 2] }),
]);

const THURSDAY = day(4, "Lower Hypertrophy", "Lower Hypertrophy", "lifting", null, [
  lift("thu-hack-squat", "hack-squat", {
    sets: 3, reps: [8, 12], rest: REST.compound, rir: [2, 2], increment: 10,
    notes: "If neither machine is available, use leg press.",
  }),
  lift("thu-bulgarian-split-squat", "bulgarian-split-squat", { sets: 2, reps: [8, 10], rest: REST.compound, rir: [2, 2], perSide: true }),
  lift("thu-leg-curl", "leg-curl", { sets: 3, reps: [10, 15], rest: REST.ninety, rir: [1, 2] }),
  lift("thu-hip-thrust", "hip-thrust", { sets: 2, reps: [8, 12], rest: REST.compound, rir: [1, 2] }),
  lift("thu-leg-extension", "leg-extension", { sets: 2, reps: [12, 15], rest: REST.ninety, rir: [1, 1] }),
  lift("thu-standing-calf-raise", "standing-calf-raise", { sets: 3, reps: [10, 15], rest: REST.ninety, rir: [1, 2] }),
  lift("thu-back-extension", "back-extension", { sets: 2, reps: [10, 15], rest: REST.ninety, rir: [2, 2], progression: "bodyweight_reps" }),
  lift("thu-pallof-press", "pallof-press", {
    sets: 2, reps: [10, 15], rest: REST.accessory, rir: null, perSide: true, notes: "Controlled.",
  }),
]);

const FRIDAY = day(5, "Upper Specialization", "Upper Specialization / Relative Strength Foundation", "lifting", null, [
  item("fri-prep-scapular-pull-up", "scapular-pull-up", "prep", {
    sets: 2, reps: [5, 8], notes: "Technically clean. Not taken near failure.",
  }),
  lift("fri-strict-pull-up", "strict-pull-up", {
    sets: 3, reps: [5, 8], rest: REST.compound, rir: [2, 2], progression: "assistance_reduction",
    notes: "Use assistance if you can't yet do the full range strictly. Enter 0 when unassisted.",
  }),
  lift("fri-dip", "dip", {
    sets: 3, reps: [6, 10], rest: REST.compound, rir: [2, 2], progression: "assistance_reduction",
    notes: "If shoulder position is uncomfortable, use assistance and a pain-free range. Don't force depth.",
  }),
  lift("fri-landmine-press", "half-kneeling-landmine-press", { sets: 2, reps: [8, 12], rest: REST.ninety, rir: [2, 3], perSide: true }),
  lift("fri-lateral-raise", "lateral-raise", { sets: 3, reps: [12, 20], rest: REST.accessory, rir: [1, 2] }),
  lift("fri-rear-delt-fly", "rear-delt-fly", { sets: 2, reps: [15, 25], rest: REST.accessory, rir: [1, 2] }),
  lift("fri-hammer-curl", "hammer-curl", { sets: 3, reps: [8, 12], rest: REST.accessory, rir: [1, 2] }),
  lift("fri-overhead-triceps", "overhead-cable-triceps-extension", { sets: 3, reps: [10, 15], rest: REST.accessory, rir: [1, 2] }),
  item("fri-dead-hang", "dead-hang", "main", {
    sets: 2, seconds: [20, 40],
    notes: "Stop if painful or if shoulder position feels unstable.",
  }),
]);

const SATURDAY = day(
  6,
  "Aerobic + Mobility",
  "Long Easy Aerobic + Mobility",
  "aerobic_mobility",
  "Do cardio earlier in the day so there's time to eat and recover before the fast.",
  [
    item("sat-knee-to-wall", "knee-to-wall", "mobility", { sets: 2, reps: [8, 8], perSide: true }),
    item("sat-deep-squat", "supported-deep-squat", "mobility", { sets: 2, seconds: [30, 45] }),
    item("sat-90-90", "90-90-hip-rotation", "mobility", { sets: 2, reps: [6, 6], perSide: true }),
    item("sat-adductor-rockback", "adductor-rockback", "mobility", { sets: 2, reps: [8, 8] }),
    item("sat-thoracic-extension", "thoracic-extension", "mobility", { sets: 2, reps: [6, 6], notes: "Slow reps." }),
    item("sat-bench-lat-stretch", "bench-lat-stretch", "mobility", { sets: 2, reps: [8, 8] }),
    item("sat-wall-slide", "wall-slide", "mobility", { sets: 2, reps: [8, 10] }),
    item("sat-split-stance-hold", "split-stance-hold", "mobility", { sets: 2, seconds: [20, 30], perSide: true }),
  ],
);

const SUNDAY = day(
  7,
  "Rest · Fast",
  "Complete Rest + Fast",
  "rest",
  "No training today. Resume Monday.",
  [],
);

// ---------------------------------------------------------------------------
// Cardio ramp (docs/02-TRAINING.md "Cardio Ramp"), stored week by week.

type Minutes = number | readonly [number, number];
type WeekPlan = Partial<Record<DayOfWeek, Minutes>>;

const WEEKS_1_2: WeekPlan = { 1: 15, 3: 20, 5: [15, 20], 6: 30 };
const WEEKS_3_4: WeekPlan = { 1: 20, 2: 15, 3: [20, 25], 5: 20, 6: [35, 40] };
const WEEKS_5_8: WeekPlan = { 1: [20, 25], 2: [15, 20], 3: [25, 30], 4: [15, 20], 5: [25, 30], 6: [45, 60] };
const WEEKS_9_11: WeekPlan = { 1: [25, 30], 2: [20, 25], 3: 30, 4: [20, 25], 5: 30, 6: [60, 75] };

function deloadPlan(plan: WeekPlan): WeekPlan {
  const out: WeekPlan = {};
  for (const [dow, m] of Object.entries(plan) as [string, Minutes][]) {
    out[Number(dow) as DayOfWeek] =
      typeof m === "number" ? deloadMinutes(m) : [deloadMinutes(m[0]), deloadMinutes(m[1])];
  }
  return out;
}

const WEEK_PLANS: Record<number, WeekPlan> = {
  1: WEEKS_1_2,
  2: WEEKS_1_2,
  3: WEEKS_3_4,
  4: deloadPlan(WEEKS_3_4),
  5: WEEKS_5_8,
  6: WEEKS_5_8,
  7: WEEKS_5_8,
  8: deloadPlan(WEEKS_5_8),
  9: WEEKS_9_11,
  10: WEEKS_9_11,
  11: WEEKS_9_11,
  12: deloadPlan(WEEKS_9_11),
};

const SATURDAY_CARDIO_NOTE =
  "Conversational pace. No intervals. Incline treadmill walking is fine once tolerated.";

function buildCardio(): CardioPrescription[] {
  const rows: CardioPrescription[] = [];
  for (const [week, plan] of Object.entries(WEEK_PLANS)) {
    for (const [dow, m] of Object.entries(plan) as [string, Minutes][]) {
      const [min, max] = typeof m === "number" ? [m, m] : m;
      rows.push({
        weekNumber: Number(week),
        dayOfWeek: Number(dow) as DayOfWeek,
        modality: "bike",
        targetMinutes: min,
        targetMinutesMax: max > min ? max : null,
        targetRpeMin: 2,
        targetRpeMax: 3,
        notes: dow === "6" ? SATURDAY_CARDIO_NOTE : "Easy, conversational effort.",
      });
    }
  }
  return rows.sort((a, b) => a.weekNumber - b.weekNumber || a.dayOfWeek - b.dayOfWeek);
}

// ---------------------------------------------------------------------------

export const PHASE_1: ProgramBlock = {
  slug: "phase-1-foundation",
  name: "Phase 1 — Foundation",
  description:
    "12 weeks. Build muscle, bench and pull-up/dip strength, lower-body strength, an aerobic base, and mobility prerequisites.",
  durationWeeks: 12,
  deloadWeeks: [4, 8, 12],
  exercises: EXERCISES,
  days: [MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY],
  cardio: buildCardio(),
};
