// Loads the active program from Supabase and maps rows to domain types.

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CardioPrescription,
  DayOfWeek,
  Exercise,
  Prescription,
  ProgramBlock,
  ProgramDay,
} from "@/lib/training/types";

/** Domain block plus the row ids persistence needs. */
export interface LoadedProgram {
  block: ProgramBlock;
  blockId: string;
  dayIds: Record<DayOfWeek, string>;
  prescriptionIds: Record<string, string>; // by prescription key
  exerciseIds: Record<string, string>; // by exercise slug
  exerciseSlugsById: Record<string, string>;
  prescriptionKeysById: Record<string, string>;
}

interface ExerciseRow {
  id: string;
  slug: string;
  name: string;
  category: Exercise["category"];
  load_type: Exercise["loadType"];
  load_direction: Exercise["loadDirection"];
  image_url: string | null;
  video_url: string | null;
  animation_url: string | null;
  instructions: string | null;
}

interface PrescriptionRow {
  id: string;
  key: string;
  exercise_id: string;
  section: Prescription["section"];
  sort_order: number;
  sets: number;
  sets_max: number | null;
  rep_min: number | null;
  rep_max: number | null;
  duration_seconds: number | null;
  duration_seconds_max: number | null;
  per_side: boolean;
  rest_seconds: number | null;
  target_rir_min: number | string | null;
  target_rir_max: number | string | null;
  progression_type: Prescription["progressionType"];
  load_increment: number | string | null;
  notes: string | null;
  is_optional: boolean;
}

interface DayRow {
  id: string;
  day_of_week: DayOfWeek;
  name: string;
  full_name: string;
  session_type: ProgramDay["sessionType"];
  notes: string | null;
  exercise_prescriptions: PrescriptionRow[];
}

interface CardioRow {
  week_number: number;
  day_of_week: DayOfWeek;
  modality: CardioPrescription["modality"];
  target_minutes: number;
  target_minutes_max: number | null;
  target_rpe_min: number;
  target_rpe_max: number;
  notes: string | null;
}

interface BlockRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  duration_weeks: number;
  deload_weeks: number[];
  program_days: DayRow[];
  cardio_prescriptions: CardioRow[];
}

// numeric columns arrive as strings from PostgREST.
const num = (v: number | string | null): number | null => (v === null ? null : Number(v));

export async function loadActiveProgram(supabase: SupabaseClient): Promise<LoadedProgram> {
  const [blockRes, exerciseRes] = await Promise.all([
    supabase
      .from("program_blocks")
      .select("id, slug, name, description, duration_weeks, deload_weeks, program_days(*, exercise_prescriptions(*)), cardio_prescriptions(*)")
      .eq("is_active", true)
      .single<BlockRow>(),
    supabase.from("exercises").select("*").returns<ExerciseRow[]>(),
  ]);
  if (blockRes.error) throw new Error(`Loading program failed: ${blockRes.error.message}`);
  if (exerciseRes.error) throw new Error(`Loading exercises failed: ${exerciseRes.error.message}`);

  const b = blockRes.data;
  const exerciseRows = exerciseRes.data ?? [];
  const slugById = Object.fromEntries(exerciseRows.map((e) => [e.id, e.slug]));

  const prescriptionIds: Record<string, string> = {};
  const prescriptionKeysById: Record<string, string> = {};
  const dayIds = {} as Record<DayOfWeek, string>;

  const days: ProgramDay[] = [...b.program_days]
    .sort((x, y) => x.day_of_week - y.day_of_week)
    .map((d) => {
      dayIds[d.day_of_week] = d.id;
      return {
        dayOfWeek: d.day_of_week,
        name: d.name,
        fullName: d.full_name,
        sessionType: d.session_type,
        notes: d.notes,
        prescriptions: [...d.exercise_prescriptions]
          .sort((x, y) => x.sort_order - y.sort_order)
          .map((p): Prescription => {
            prescriptionIds[p.key] = p.id;
            prescriptionKeysById[p.id] = p.key;
            return {
              key: p.key,
              exerciseSlug: slugById[p.exercise_id],
              section: p.section,
              sortOrder: p.sort_order,
              sets: p.sets,
              setsMax: p.sets_max,
              repMin: p.rep_min,
              repMax: p.rep_max,
              durationSeconds: p.duration_seconds,
              durationSecondsMax: p.duration_seconds_max,
              perSide: p.per_side,
              restSeconds: p.rest_seconds,
              targetRirMin: num(p.target_rir_min),
              targetRirMax: num(p.target_rir_max),
              progressionType: p.progression_type,
              loadIncrement: num(p.load_increment),
              notes: p.notes,
              isOptional: p.is_optional,
            };
          }),
      };
    });

  const block: ProgramBlock = {
    slug: b.slug,
    name: b.name,
    description: b.description ?? "",
    durationWeeks: b.duration_weeks,
    deloadWeeks: b.deload_weeks ?? [],
    exercises: exerciseRows.map((e) => ({
      slug: e.slug,
      name: e.name,
      category: e.category,
      loadType: e.load_type,
      loadDirection: e.load_direction,
      imageUrl: e.image_url,
      videoUrl: e.video_url,
      animationUrl: e.animation_url,
      instructions: e.instructions,
    })),
    days,
    cardio: b.cardio_prescriptions
      .map((c) => ({
        weekNumber: c.week_number,
        dayOfWeek: c.day_of_week,
        modality: c.modality,
        targetMinutes: c.target_minutes,
        targetMinutesMax: c.target_minutes_max,
        targetRpeMin: c.target_rpe_min,
        targetRpeMax: c.target_rpe_max,
        notes: c.notes,
      }))
      .sort((x, y) => x.weekNumber - y.weekNumber || x.dayOfWeek - y.dayOfWeek),
  };

  return {
    block,
    blockId: b.id,
    dayIds,
    prescriptionIds,
    prescriptionKeysById,
    exerciseIds: Object.fromEntries(exerciseRows.map((e) => [e.slug, e.id])),
    exerciseSlugsById: slugById,
  };
}
