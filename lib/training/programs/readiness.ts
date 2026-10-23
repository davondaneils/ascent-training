/**
 * Five-year capability-oriented physical curriculum.
 * Every campaign arc has a real 13-week lifting + endurance prescription.
 *
 * The plan is a calendar scaffold, not a claim that a user is ready for its hardest
 * activity. Run, swim and loaded-hike sessions have explicit lower-impact alternatives
 * and a preflight acknowledgement in the cardio logger. Do not progress on dates alone.
 */
import { addDays } from "@/lib/dates";
import { CAMPAIGN_CYCLES } from "@/lib/campaign/roadmap";
import { addCalendarYears, campaignPosition } from "@/lib/campaign/schedule";
import { deloadMinutes } from "../deload";
import type {
  CardioModality, CardioPrescription, Exercise, LocalDate,
  Prescription, ProgramBlock, ProgramDay,
} from "../types";
import { PHASE_1 } from "./phase-1";

type StrengthStage = "foundation" | "bridge" | "capacity" | "durability" | "integration";
type Lift = readonly [
  slug: string, sets: number, min: number, max: number, rest: number,
  rir: number, mode?: "assistance_reduction" | "bodyweight_reps", increment?: number,
];
const L = (slug: string, sets: number, min: number, max: number, rest: number, rir = 2,
  mode?: "assistance_reduction" | "bodyweight_reps", increment?: number): Lift =>
  [slug, sets, min, max, rest, rir, mode, increment];

type StrengthDay = { name: string; exercises: Lift[]; carrySeconds: number; notes: string };
type StrengthWeek = [StrengthDay, StrengthDay, StrengthDay];

function strengthFor(stage: StrengthStage): StrengthWeek {
  if (stage === "foundation") return [
    { name: "Strength A · Press & Squat", notes: "Establish pain-free movement and controlled loads, keeping 2–3 reps in reserve.",
      exercises: [L("bench-press", 3, 5, 8, 180), L("leg-press", 3, 8, 10, 150, 2, undefined, 10),
        L("pull-up", 3, 5, 8, 120, 2, "assistance_reduction"), L("chest-supported-row", 2, 8, 12, 90)],
      carrySeconds: 20 },
    { name: "Strength B · Hinge & Pull", notes: "Hinge and unilateral control first; keep every repetition technically consistent.",
      exercises: [L("romanian-deadlift", 3, 6, 8, 150), L("incline-db-press", 3, 8, 12, 120),
        L("lat-pulldown", 3, 8, 12, 90), L("reverse-lunge", 2, 8, 10, 90)],
      carrySeconds: 20 },
    { name: "Strength C · Full Body", notes: "Moderate technique-focused session. Leave energy for Saturday's long easy walk.",
      exercises: [L("heel-elevated-goblet-squat", 3, 8, 10, 90, 3), L("bench-press", 2, 6, 10, 150),
        L("strict-pull-up", 3, 5, 8, 120, 2, "assistance_reduction"),
        L("hip-thrust", 2, 8, 12, 90)], carrySeconds: 25 },
  ];
  if (stage === "bridge") return [
    { name: "Strength A · Squat & Press", notes: "Build general strength with moderate fatigue; running is still a gradual skill.",
      exercises: [L("leg-press", 3, 6, 10, 150, 2, undefined, 10), L("bench-press", 3, 5, 8, 180),
        L("pull-up", 3, 5, 8, 120, 2, "assistance_reduction"), L("chest-supported-row", 2, 8, 12, 90)],
      carrySeconds: 25 },
    { name: "Strength B · Hinge & Press", notes: "Keep hamstrings and calves healthy while run/walk tolerance develops.",
      exercises: [L("romanian-deadlift", 3, 6, 8, 150), L("incline-db-press", 3, 8, 12, 120),
        L("lat-pulldown", 3, 8, 12, 90), L("reverse-lunge", 2, 8, 10, 120)],
      carrySeconds: 25 },
    { name: "Strength C · Carry & Control", notes: "Practical strength without exhausting your legs before the long walk.",
      exercises: [L("heel-elevated-goblet-squat", 2, 8, 12, 90, 3), L("paused-bench-press", 3, 6, 8, 150),
        L("strict-pull-up", 3, 5, 8, 120, 2, "assistance_reduction"), L("seated-cable-row", 2, 8, 12, 90)],
      carrySeconds: 30 },
  ];
  if (stage === "capacity") return [
    { name: "Strength A · Heavy Foundation", notes: "Train strength deliberately, never to failure; endurance takes priority too.",
      exercises: [L("leg-press", 3, 5, 8, 180, 2, undefined, 10), L("bench-press", 3, 4, 6, 180),
        L("pull-up", 3, 5, 8, 120, 2, "assistance_reduction"), L("chest-supported-row", 2, 8, 12, 90)],
      carrySeconds: 30 },
    { name: "Strength B · Hinge & Unilateral", notes: "Maintain leg capacity while adapting safely to progressive hiking.",
      exercises: [L("romanian-deadlift", 3, 5, 8, 150), L("bulgarian-split-squat", 2, 8, 10, 120),
        L("incline-db-press", 3, 6, 10, 120), L("lat-pulldown", 2, 8, 12, 90)],
      carrySeconds: 30 },
    { name: "Strength C · Relative Strength", notes: "Grip and pulling quality matter more than gym volume.",
      exercises: [L("strict-pull-up", 3, 5, 8, 120, 2, "assistance_reduction"),
        L("hack-squat", 2, 8, 10, 120, 2, undefined, 10), L("half-kneeling-landmine-press", 3, 8, 10, 90),
        L("seated-cable-row", 2, 8, 12, 90)], carrySeconds: 35 },
  ];
  if (stage === "durability") return [
    { name: "Strength A · Strength Reserve", notes: "Retain useful strength without compromising running or recovery.",
      exercises: [L("leg-press", 3, 5, 8, 180, 2, undefined, 10), L("bench-press", 3, 4, 6, 180),
        L("strict-pull-up", 3, 5, 8, 120, 2, "assistance_reduction"), L("chest-supported-row", 2, 8, 12, 90)],
      carrySeconds: 35 },
    { name: "Strength B · Movement Capacity", notes: "Single-leg control, hinging, grip and trunk under repeatable load.",
      exercises: [L("romanian-deadlift", 3, 6, 8, 150), L("reverse-lunge", 3, 8, 10, 120),
        L("incline-db-press", 2, 8, 10, 120), L("lat-pulldown", 2, 8, 12, 90)],
      carrySeconds: 35 },
    { name: "Strength C · Low-Fatigue Strength", notes: "Protect Saturday's long endurance session; stop well short of failure.",
      exercises: [L("heel-elevated-goblet-squat", 2, 8, 12, 90, 3), L("paused-bench-press", 2, 6, 8, 150),
        L("pull-up", 3, 5, 8, 120, 2, "assistance_reduction"), L("half-kneeling-landmine-press", 2, 8, 10, 90)],
      carrySeconds: 40 },
  ];
  return [
    { name: "Strength A · Maintain Capability", notes: "Keep strong enough to help without sacrificing health and energy.",
      exercises: [L("leg-press", 3, 6, 8, 150, 2, undefined, 10), L("bench-press", 3, 5, 8, 180),
        L("strict-pull-up", 3, 5, 8, 120, 2, "assistance_reduction"), L("chest-supported-row", 2, 8, 12, 90)],
      carrySeconds: 35 },
    { name: "Strength B · Hinge & Carry", notes: "Prioritize efficient, repeatable movement over peak numbers.",
      exercises: [L("romanian-deadlift", 3, 6, 8, 150), L("reverse-lunge", 2, 8, 10, 120),
        L("incline-db-press", 2, 8, 10, 120), L("lat-pulldown", 2, 8, 12, 90)],
      carrySeconds: 40 },
    { name: "Strength C · Strength & Skill", notes: "A manageable session before Saturday. Quality over volume.",
      exercises: [L("heel-elevated-goblet-squat", 2, 8, 12, 90, 3), L("paused-bench-press", 2, 6, 8, 150),
        L("pull-up", 3, 5, 8, 120, 2, "assistance_reduction"), L("half-kneeling-landmine-press", 2, 8, 12, 90)],
      carrySeconds: 35 },
  ];
}

function workoutExercise(blockSlug: string, dow: number, index: number, x: Lift): Prescription {
  const [exerciseSlug, sets, repMin, repMax, restSeconds, rir, mode, increment] = x;
  return {
    key: `${blockSlug}:${dow}:${index}:${exerciseSlug}`, exerciseSlug, section: "main", sortOrder: index + 1,
    sets, setsMax: null, repMin, repMax, durationSeconds: null, durationSecondsMax: null,
    perSide: ["reverse-lunge", "bulgarian-split-squat", "half-kneeling-landmine-press"].includes(exerciseSlug),
    restSeconds, targetRirMin: rir, targetRirMax: rir + 1,
    progressionType: mode ?? "double_progression", loadIncrement: mode === "bodyweight_reps" ? null : (increment ?? 5),
    notes: null, isOptional: false,
  };
}

function carry(blockSlug: string, dow: number, seconds: number): Prescription {
  return {
    key: `${blockSlug}:${dow}:carry`, exerciseSlug: "farmer-carry", section: "main", sortOrder: 5,
    sets: 2, setsMax: null, repMin: null, repMax: null, durationSeconds: seconds,
    durationSecondsMax: null, perSide: false, restSeconds: 90,
    targetRirMin: null, targetRirMax: null, progressionType: "none", loadIncrement: null,
    notes: "Light, controlled carries on a clear path. Choose a load you can walk with upright and record it per hand. Add load only in small steps when every carry stays tall and pain-free; record tested loaded-carry performance separately.",
    isOptional: false,
  };
}

function movement(blockSlug: string, dow: number, order: number, slug: string,
  reps: number, perSide = false): Prescription {
  return {
    key: `${blockSlug}:${dow}:mobility:${slug}`, exerciseSlug: slug, section: "mobility", sortOrder: order,
    sets: 2, setsMax: null, repMin: reps, repMax: reps, durationSeconds: null, durationSecondsMax: null,
    perSide, restSeconds: null, targetRirMin: null, targetRirMax: null, progressionType: "none",
    loadIncrement: null, notes: "Slow and comfortable. No forcing range.", isOptional: false,
  };
}

/** The first cycle whose Tuesday modality is a continuous run (Year 2, third quarter). */
const FIRST_RUN_CYCLE = 6;
const WARM_UP_MINUTES = 10;
const PAIN_RULE = " If anything hurts, or the hard parts feel strained, drop to easy running or walking for the rest of the session.";

type QualityRun = { notes: string; rpeMin: number; rpeMax: number; workMinutes: number };

/**
 * One weekly quality run, replacing the easy Tuesday run in run cycles only. Never in recovery
 * weeks. The first run cycle is relaxed strides; later cycles alternate short tempo and short
 * intervals, rising slowly within the cycle (one step per mesocycle) and across cycles, capped.
 * The work always fits inside the session after a 10-minute easy warm-up.
 */
export function qualityRun(cycleIndex: number, week: number, targetMinutes: number): QualityRun | null {
  if (cycleIndex < FIRST_RUN_CYCLE || week === 4 || week === 8 || week === 13) return null;
  const level = cycleIndex - FIRST_RUN_CYCLE; // 0..13
  const meso = week < 4 ? 0 : week < 8 ? 1 : 2;
  const room = targetMinutes - WARM_UP_MINUTES - 5; // keep at least 5 easy minutes to finish
  const open = `Quality run: ${WARM_UP_MINUTES} min very easy jogging first.`;
  const close = " Jog or walk easily for the remaining time. Only if your easy runs feel comfortable this week; otherwise keep the whole session easy.";

  if (level === 0) {
    const reps = 4 + meso;
    return {
      notes: `${open} Then ${reps} × 20 sec relaxed, quicker strides (RPE 4–5, smooth, never a sprint) with a full walk back between.${close}${PAIN_RULE}`,
      rpeMin: 3, rpeMax: 5, workMinutes: reps,
    };
  }
  if (week % 2 === 1) {
    let tempo = Math.min(20, 6 + 2 * (level - 1) + 2 * meso);
    while (tempo > 4 && tempo > room) tempo -= 2;
    const shape = tempo <= 10 ? `2 × ${tempo / 2} min` : `${tempo} min continuous`;
    return {
      notes: `${open} Then ${shape} tempo: comfortably hard (RPE 5–6), steady, able to speak in short phrases${tempo <= 10 ? ", with 2 min easy jogging between" : ""}.${close}${PAIN_RULE}`,
      rpeMin: 3, rpeMax: 6, workMinutes: tempo <= 10 ? tempo + 2 : tempo,
    };
  }
  const repMinutes = level < 6 ? 1 : 2;
  const start = repMinutes === 1 ? Math.floor(level / 2) : Math.floor((level - 6) / 2);
  let reps = Math.min(repMinutes === 1 ? 8 : 6, 4 + start + meso);
  while (reps > 2 && reps * (repMinutes + 2) > room) reps -= 1;
  return {
    notes: `${open} Then ${reps} × ${repMinutes} min brisk (RPE 6–7, controlled, not all-out) with 2 min easy jogging or walking after each.${close}${PAIN_RULE}`,
    rpeMin: 3, rpeMax: 7, workMinutes: reps * (repMinutes + 2),
  };
}

function weeklyCardio(cycleIndex: number): CardioPrescription[] {
  const year = Math.floor(cycleIndex / 4) + 1;
  const quarter = cycleIndex % 4;
  const base: [number, number, number] =
    year === 1 ? [
      [20, 20, 35], [22, 25, 45], [25, 30, 55], [30, 30, 65],
    ][quarter] as [number, number, number]
    : year === 2 ? [
      [30, 30, 75], [32, 35, 85], [35, 35, 95], [38, 40, 100],
    ][quarter] as [number, number, number]
    : year === 3 ? [
      [38, 40, 100], [40, 40, 110], [42, 45, 110], [42, 45, 115],
    ][quarter] as [number, number, number]
    : year === 4 ? [
      [40, 45, 115], [43, 45, 120], [42, 45, 115], [40, 40, 105],
    ][quarter] as [number, number, number]
    : [
      [40, 40, 100], [42, 45, 110], [42, 45, 115], [38, 40, 95],
    ][quarter] as [number, number, number];
  const mode: [CardioModality, CardioModality, CardioModality] =
    cycleIndex === 0 ? ["bike", "incline_walk", "hike"] :
    cycleIndex < 3 ? ["run_walk", "swim", "hike"] :
    cycleIndex === 3 ? ["run_walk", "swim", "hike"] :
    year === 2 && quarter < 2 ? ["run_walk", "swim", "loaded_hike"] :
    ["run", "swim", "loaded_hike"];
  const notes: Record<CardioModality, string> = {
    bike: "Conversational, RPE 2–3. Build basic aerobic tolerance. No intervals.",
    incline_walk: "Comfortable walking; adjust incline down to protect joints. Stay conversational.",
    hike: "Unloaded daylight walking on a safe known route. Build duration gradually. Carry water and use a turn-back plan.",
    run_walk: "Only if you can walk 40 minutes pain-free: repeat 1 min very easy jogging and 2–3 min walking, adjusting to your baseline. Otherwise choose walking or cycling.",
    run: "Conversational run only if run/walk is well tolerated on multiple occasions. Otherwise choose run/walk or walking. No racing.",
    swim: "Use a supervised pool or qualified instructor. Technique, floating, breathing normally, and comfortable lengths. Never practice breath-holding alone. Choose walking or cycling when a safe pool is unavailable.",
    loaded_hike: "Only after comfortable unloaded hikes. Start with an empty or very light pack (0–3 kg); gradually build only with pain-free recovery. No forced load, distance or terrain.",
  };
  const out: CardioPrescription[] = [];
  for (let w = 1; w <= 13; w++) {
    for (const [i, dow] of ([2, 4, 6] as const).entries()) {
      const isRecovery = w === 4 || w === 8 || w === 13;
      const step = Math.floor((w - 1) / 3);
      let minutes = base[i] + step * (i === 2 ? 5 : 3);
      minutes = isRecovery ? deloadMinutes(minutes) : minutes;
      const caution = mode[i] === "loaded_hike"
        ? ` Suggested maximum load for this cycle: ${year === 2 ? "3–6" : year === 3 ? "5–9" : "8–15"} kg, only after your own gradual progression; never jump to the maximum.`
        : "";
      const quality = mode[i] === "run" ? qualityRun(cycleIndex, w, minutes) : null;
      out.push({
        weekNumber: w, dayOfWeek: dow, modality: mode[i], targetMinutes: minutes,
        targetMinutesMax: null, targetRpeMin: quality?.rpeMin ?? 2, targetRpeMax: quality?.rpeMax ?? 4,
        notes: (quality?.notes ?? notes[mode[i]]) + caution +
          (w === 13 ? " Review week: stay fresh for a safe, non-maximal capability assessment." : ""),
      });
    }
  }
  return out;
}

const carryExercise: Exercise = {
  // "dumbbell": the logger records the load per hand (optional for this timed carry).
  slug: "farmer-carry", name: "Farmer's Carry", category: "strength", loadType: "dumbbell",
  loadDirection: "higher_is_harder", imageUrl: null, videoUrl: null,
  animationUrl: null, instructions: "Walk tall with light matched dumbbells; stop when grip, balance or posture deteriorates.",
};

export function createReadinessBlock(cycleIndex: number): ProgramBlock {
  const cycle = CAMPAIGN_CYCLES[cycleIndex];
  if (!cycle) throw new Error("Invalid physical cycle index: " + cycleIndex);
  const stage: StrengthStage = cycle.year === 1 && cycle.quarter === 1 ? "foundation"
    : cycle.year === 1 ? "bridge"
    : cycle.year === 2 ? "capacity"
    : cycle.year === 3 ? "durability"
    : "integration";
  const slug = "readiness-" + cycle.id;
  const strength = strengthFor(stage);
  const exercises = [...PHASE_1.exercises, carryExercise];
  const known = new Set(exercises.map((e) => e.slug));
  const cardio = weeklyCardio(cycleIndex);
  const swims = cardio.some((c) => c.modality === "swim");
  const days: ProgramDay[] = [
    ...([1, 3, 5] as const).map((dow, i): ProgramDay => {
      const plan = strength[i];
      const lifts = plan.exercises.map((x, index) => workoutExercise(slug, dow, index, x));
      // Every physical cycle retains a farmer's carry with timer support.
      const timed = carry(slug, dow, plan.carrySeconds);
      timed.sortOrder = lifts.length + 1;
      return {
        dayOfWeek: dow, name: plan.name, fullName: plan.name, sessionType: "lifting",
        notes: plan.notes, prescriptions: [...lifts, timed],
      };
    }),
    { dayOfWeek: 2, name: "Aerobic Development", fullName: "Easy Aerobic / Run-Walk", sessionType: "aerobic_mobility",
      notes: "Take the low-impact alternative until joints and breathing tolerate the planned modality.", prescriptions: [] },
    { dayOfWeek: 4, name: swims ? "Water Skills & Mobility" : "Easy Aerobic & Mobility",
      fullName: swims ? "Supervised Swim / Mobility" : "Easy Aerobic / Mobility",
      sessionType: "aerobic_mobility",
      notes: swims
        ? "Only swim with appropriate supervision. Use walking or cycling if a safe pool is unavailable."
        : "Comfortable walking or cycling, then the mobility checklist. Swimming begins next cycle.",
      prescriptions: [
        movement(slug, 4, 1, "knee-to-wall", 8, true),
        movement(slug, 4, 2, "90-90-hip-switch", 6, true),
        movement(slug, 4, 3, "thoracic-extension", 6),
        movement(slug, 4, 4, "wall-slide", 8),
      ] },
    { dayOfWeek: 6, name: "Long Endurance", fullName: "Long Daylight Walk / Progressive Hike",
      sessionType: "aerobic_mobility",
      notes: "Sustainable pace, safe weather and terrain, clear turn-back point. Do not pile extra intense drills on top.",
      prescriptions: [
        movement(slug, 6, 1, "knee-to-wall", 8, true),
        movement(slug, 6, 2, "adductor-rockback", 8),
      ] },
    { dayOfWeek: 7, name: "Rest · Worship", fullName: "Rest, Worship & Family",
      sessionType: "rest", notes: "No scheduled training. Voluntary fasting only if safe for you.", prescriptions: [] },
  ];
  days.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  for (const day of days) for (const p of day.prescriptions)
    if (!known.has(p.exerciseSlug)) throw new Error(`Unknown exercise ${p.exerciseSlug}`);
  return {
    slug, name: `Year ${cycle.year} · ${cycle.title}`,
    description: `13-week physical cycle: ${stage}. ${cycle.focus}. Three full-body strength sessions, ` +
      "two aerobic/water days, one progressively longer walk/hike, and Sunday rest. Advanced modalities are optional and must be earned.",
    durationWeeks: 13, deloadWeeks: [4, 8, 13], exercises, days, cardio,
  };
}

export const READINESS_BLOCKS: readonly ProgramBlock[] =
  CAMPAIGN_CYCLES.map((_, index) => createReadinessBlock(index));

export function physicalBlockForDate(campaignStart: LocalDate, date: LocalDate): {
  blockSlug: string; startDate: LocalDate; cycleIndex: number;
} {
  const position = campaignPosition(campaignStart, date);
  const yearStart = addCalendarYears(campaignStart, position.year - 1);
  return {
    blockSlug: READINESS_BLOCKS[position.cycleIndex].slug,
    startDate: addDays(yearStart, (position.cycle.quarter - 1) * 91),
    cycleIndex: position.cycleIndex,
  };
}
