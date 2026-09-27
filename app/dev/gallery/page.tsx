import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/shared/bottom-nav";
import { TopBar } from "@/components/shared/top-bar";
import { TodayView, type TodayData } from "@/components/today/today-view";
import { ActiveWorkout } from "@/components/workout/active-workout";
import { buildExerciseInfos, buildWorkoutMeta } from "@/components/workout/build-infos";
import { MediaFrame } from "@/components/workout/exercise-media";
import { CardioSessionView } from "@/components/cardio/cardio-session";
import { WorkoutSummary } from "@/components/workout/workout-summary";
import { MEDIA_MAP } from "@/lib/training/programs/media-map";
import { PHASE_1 } from "@/lib/training/programs/phase-1";
import { resolveDay } from "@/lib/training/schedule";
import { createSession, sessionReducer, summarizeSession, type SessionAction } from "@/lib/training/session";
import type { ExercisePerformance } from "@/lib/training/types";

// Dev-only visual QA: every key screen state rendered from fixtures (no auth, no data, no writes).

export const dynamic = "force-dynamic";

const VIEWS = [
  "today-lifting",
  "today-done",
  "today-saturday",
  "today-sunday",
  "today-prestart",
  "workout-first",
  "workout-progress",
  "workout-rest",
  "workout-complete",
  "workout-summary",
  "cardio-weekday",
  "cardio-saturday",
  "media",
] as const;
type View = (typeof VIEWS)[number];

const block = PHASE_1;
const exerciseIds = Object.fromEntries(block.exercises.map((e) => [e.slug, e.slug]));
const USER = "00000000-0000-0000-0000-000000000000";

function today(date: string, week: number, over: Partial<TodayData> = {}): TodayData {
  return {
    block,
    exerciseIds,
    userId: USER,
    today: { status: "active", date, resolved: resolveDay(block, week, date) },
    workout: null,
    cardioLogs: [],
    mobilityDone: [],
    completion: { lifting: 1, cardio: 1 },
    scheduled: { lifting: 5, cardio: 5 },
    ...over,
  };
}

function workoutFixture(view: View, now: number) {
  const resolved = resolveDay(block, 3, "2026-10-19");
  let session = createSession({
    workoutId: "gallery",
    now: now - 12 * 60_000,
    exercises: resolved.exercises.map((p, i) => ({
      id: `we-${i}`,
      prescriptionKey: p.key,
      exerciseSlug: p.exerciseSlug,
      targetSets: p.sets,
      restSeconds: p.restSeconds,
    })),
  });
  const set = (i: number, weight: number, reps: number, at: number): SessionAction => ({
    type: "complete_set",
    setId: `s-${i}`,
    weight,
    reps,
    now: at,
  });
  if (view === "workout-rest") session = [set(1, 190, 6, now - 20_000)].reduce(sessionReducer, session);
  if (view === "workout-complete" || view === "workout-summary") {
    session = [set(1, 190, 6, now - 600_000), set(2, 190, 6, now - 400_000), set(3, 190, 5, now - 200_000), set(4, 190, 5, now - 15_000)].reduce(sessionReducer, session);
  }
  if (view === "workout-summary") {
    session = [{ type: "continue" } as const, set(5, 40, 8, now - 10_000), set(6, 40, 7, now - 5_000), { type: "finish", now } as const].reduce(sessionReducer, session);
  }
  const history: ExercisePerformance[] =
    view === "workout-first"
      ? []
      : [
          {
            workoutId: "prev",
            date: "2026-10-12",
            weekNumber: 2,
            isDeload: false,
            prescriptionKey: "mon-bench-press",
            exerciseSlug: "bench-press",
            sets: [6, 6, 6, 6].map((reps, i) => ({ setNumber: i + 1, weight: 185, reps })),
          },
          {
            workoutId: "prev",
            date: "2026-10-12",
            weekNumber: 2,
            isDeload: false,
            prescriptionKey: "mon-pull-up",
            exerciseSlug: "pull-up",
            sets: [8, 7, 7, 6].map((reps, i) => ({ setNumber: i + 1, weight: 40, reps })),
          },
        ];
  return { session, infos: buildExerciseInfos(block, session, resolved, history), meta: buildWorkoutMeta(resolved) };
}

/** Fixtures are relative to request time so timers render live (dynamic route, not prerendered). */
function requestTime(): number {
  return Date.now();
}

export default async function Gallery({ searchParams }: PageProps<"/dev/gallery">) {
  if (process.env.NODE_ENV === "production") notFound();
  const view = (await searchParams).view as View | undefined;
  const now = requestTime();

  if (!view || !VIEWS.includes(view)) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-5">
        <h1 className="type-title">Gallery</h1>
        <p className="type-body text-text-secondary">Dev-only fixtures for visual QA.</p>
        <ul className="flex flex-col divide-y divide-border-subtle rounded-[20px] border border-border-subtle bg-surface">
          {VIEWS.map((v) => (
            <li key={v}>
              <Link href={`/dev/gallery?view=${v}`} className="block px-4 py-3 type-body">
                {v}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  if (view.startsWith("today-")) {
    const data =
      view === "today-lifting"
        ? today("2026-10-19", 3)
        : view === "today-done"
          ? today("2026-10-19", 3, {
              workout: { id: "x", status: "completed" },
              cardioLogs: [{ id: "c", actualMinutes: 21, rpe: 3 }],
              completion: { lifting: 2, cardio: 2 },
            })
          : view === "today-saturday"
            ? today("2026-10-24", 3, { mobilityDone: [exerciseIds["knee-to-wall"], exerciseIds["supported-deep-squat"]] })
            : view === "today-sunday"
              ? today("2026-10-25", 3)
              : { ...today("2026-09-27", 1), today: { status: "before_start" as const, date: "2026-09-27", startDate: "2026-09-28", daysUntilStart: 1 } };
    return (
      <>
        <TopBar />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[calc(6rem+env(safe-area-inset-bottom))]">
          <TodayView {...data} />
        </main>
        <BottomNav />
      </>
    );
  }

  if (view.startsWith("cardio-")) {
    const sat = view === "cardio-saturday";
    const resolved = resolveDay(block, 3, sat ? "2026-10-24" : "2026-10-19");
    return (
      <CardioSessionView
        key={view}
        logId={`gallery-${view}`}
        date={`gallery-${view}`}
        weekNumber={3}
        blockId="gallery"
        userId={USER}
        prescription={resolved.cardio!}
        allowModalityChoice={sat}
        isDeload={false}
        persist={false}
      />
    );
  }

  if (view === "media") {
    return (
      <main className="mx-auto grid w-full max-w-md grid-cols-3 gap-3 p-4">
        {block.exercises.map((e) => (
          <figure key={e.slug} className="flex flex-col gap-1">
            <MediaFrame media={e} className="aspect-square w-full" />
            <figcaption className="text-[11px] leading-tight text-text-secondary">
              {e.name}
              <span className="block text-text-tertiary">{MEDIA_MAP[e.slug]?.match ?? "placeholder"}</span>
            </figcaption>
          </figure>
        ))}
      </main>
    );
  }

  const { session, infos, meta } = workoutFixture(view, now);
  if (view === "workout-summary") {
    return <WorkoutSummary meta={meta} summary={summarizeSession(session, now)} infoByExercise={infos} />;
  }
  return (
    <ActiveWorkout
      initialSession={session}
      infos={infos}
      meta={meta}
      userId={USER}
      exerciseIdBySlug={exerciseIds}
      date="2026-10-19"
      prep={[]}
      prepDone={[]}
      persist={false}
    />
  );
}
