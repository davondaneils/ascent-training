import { notFound } from "next/navigation";
import { ActiveWorkout } from "@/components/workout/active-workout";
import type { ExerciseInfo } from "@/components/workout/types";
import { WorkoutSummary } from "@/components/workout/workout-summary";
import { getAppContext } from "@/lib/data/context";
import { getMobilityDoneForDate } from "@/lib/data/today";
import { loadExerciseHistory, loadWorkout } from "@/lib/data/workouts";
import { getNextPrescription, getPreviousExercisePerformance, previousSetsInOrder } from "@/lib/progression";
import { formatMinutes, formatPrescription } from "@/lib/training/format";
import { resolveDay } from "@/lib/training/schedule";
import { summarizeSession } from "@/lib/training/session";

export default async function WorkoutPage({ params }: PageProps<"/workout/[workoutId]">) {
  const { workoutId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(workoutId)) notFound();

  const { user, supabase, program } = await getAppContext();
  const { block } = program;
  const loaded = await loadWorkout(supabase, program, workoutId);
  if (!loaded) notFound();
  const { workout, session } = loaded;

  const resolved = resolveDay(block, workout.week_number, workout.scheduled_date);
  const basePrescriptions = block.days.find((d) => d.dayOfWeek === resolved.dayOfWeek)!.prescriptions;

  const history = await loadExerciseHistory(supabase, program, {
    userId: user.id,
    exerciseIds: [...new Set(session.exercises.map((e) => program.exerciseIds[e.exerciseSlug]))],
    excludeWorkoutId: workoutId,
  });

  const infos: Record<string, ExerciseInfo> = {};
  for (const e of session.exercises) {
    const exercise = block.exercises.find((x) => x.slug === e.exerciseSlug)!;
    const shown = resolved.exercises.find((p) => p.key === e.prescriptionKey)!;
    const base = basePrescriptions.find((p) => p.key === e.prescriptionKey)!;
    const previous = getPreviousExercisePerformance(history, e.prescriptionKey, e.exerciseSlug);
    const rec = getNextPrescription({ exercise, prescription: base, history, isDeloadWeek: resolved.isDeload });
    infos[e.id] = {
      workoutExerciseId: e.id,
      slug: exercise.slug,
      name: exercise.name,
      category: exercise.category,
      loadType: exercise.loadType,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      animationUrl: exercise.animationUrl,
      instructions: exercise.instructions,
      notes: shown.notes,
      prescriptionText: formatPrescription({ ...shown, sets: e.targetSets }),
      repMin: shown.repMin,
      repMax: shown.repMax,
      durationSeconds: shown.durationSeconds,
      perSide: shown.perSide,
      restSeconds: e.restSeconds,
      loadIncrement: shown.loadIncrement,
      previous: previous ? previousSetsInOrder(previous) : null,
      recommendation: { kind: rec.kind, weight: rec.recommendedWeight, reason: rec.reason },
    };
  }

  const meta = {
    dayName: resolved.day.name,
    nextScheduled: resolved.cardio
      ? `Bike · ${formatMinutes(resolved.cardio.targetMinutes, resolved.cardio.targetMinutesMax)} easy`
      : null,
  };

  if (session.status === "completed") {
    return <WorkoutSummary meta={meta} summary={summarizeSession(session, session.completedAt ?? session.startedAt)} infoByExercise={infos} />;
  }

  const prepDone = resolved.prep.length > 0 ? await getMobilityDoneForDate(supabase, user.id, workout.scheduled_date) : new Set<string>();

  return (
    <ActiveWorkout
      initialSession={session}
      infos={infos}
      meta={meta}
      userId={user.id}
      exerciseIdBySlug={program.exerciseIds}
      date={workout.scheduled_date}
      prep={resolved.prep.map((p) => ({
        exerciseId: program.exerciseIds[p.exerciseSlug],
        name: block.exercises.find((x) => x.slug === p.exerciseSlug)?.name ?? p.exerciseSlug,
        detail: formatPrescription(p),
        notes: p.notes,
      }))}
      prepDone={[...prepDone]}
    />
  );
}
