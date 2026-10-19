import { notFound } from "next/navigation";
import { ActiveWorkout } from "@/components/workout/active-workout";
import { buildExerciseInfos, buildWorkoutMeta } from "@/components/workout/build-infos";
import { WorkoutSummary } from "@/components/workout/workout-summary";
import { getAppContext } from "@/lib/data/context";
import { loadProgramById } from "@/lib/data/program";
import { getMobilityDoneForDate } from "@/lib/data/today";
import { loadExerciseHistory, loadWorkout } from "@/lib/data/workouts";
import { formatPrescription } from "@/lib/training/format";
import { resolveDay } from "@/lib/training/schedule";
import { summarizeSession } from "@/lib/training/session";

export default async function WorkoutPage({ params }: PageProps<"/workout/[workoutId]">) {
  const { workoutId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(workoutId)) notFound();

  const { user, supabase, program } = await getAppContext();
  // Use the program that created the workout. This preserves historical
  // prescriptions, progression hints, and summaries after cycle changes.
  const { data: ref, error } = await supabase.from("workouts")
    .select("program_block_id").eq("id", workoutId).eq("user_id", user.id)
    .maybeSingle<{ program_block_id: string }>();
  if (error || !ref) notFound();
  const source = ref.program_block_id === program.blockId
    ? program : await loadProgramById(supabase, ref.program_block_id);
  const { block } = source;
  const loaded = await loadWorkout(supabase, source, workoutId);
  if (!loaded) notFound();
  const { workout, session } = loaded;

  const resolved = resolveDay(block, workout.week_number, workout.scheduled_date);

  const history = await loadExerciseHistory(supabase, source, {
    userId: user.id,
    exerciseIds: [...new Set(session.exercises.map((e) => source.exerciseIds[e.exerciseSlug]))],
    excludeWorkoutId: workoutId,
  });

  const infos = buildExerciseInfos(block, session, resolved, history);
  const meta = buildWorkoutMeta(resolved);

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
      exerciseIdBySlug={source.exerciseIds}
      date={workout.scheduled_date}
      prep={resolved.prep.map((p) => ({
        exerciseId: source.exerciseIds[p.exerciseSlug],
        name: block.exercises.find((x) => x.slug === p.exerciseSlug)?.name ?? p.exerciseSlug,
        detail: formatPrescription(p),
        notes: p.notes,
        holdSeconds: p.durationSeconds,
      }))}
      prepDone={[...prepDone]}
    />
  );
}
