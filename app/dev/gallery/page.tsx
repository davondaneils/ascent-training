import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/shared/bottom-nav";
import { TopBar } from "@/components/shared/top-bar";
import { TodayView, type TodayData } from "@/components/today/today-view";
import { ActiveWorkout } from "@/components/workout/active-workout";
import { buildExerciseInfos, buildWorkoutMeta } from "@/components/workout/build-infos";
import { MediaFrame } from "@/components/workout/exercise-media";
import { CardioSessionView } from "@/components/cardio/cardio-session";
import { ProgressView } from "@/components/progress/progress-view";
import { addDays } from "@/lib/dates";
import type { ProgressData } from "@/lib/data/progress";
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
  "progress-empty",
  "progress-data",
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

/** Eight weeks of plausible history starting Mon 2026-09-28. */
function progressFixture(): ProgressData {
  const start = "2026-09-28";
  const lifts: ExercisePerformance[] = [];
  const cardio: ProgressData["cardio"] = [];
  const completed: string[] = [];
  for (let w = 0; w < 8; w++) {
    const deload = w === 3 || w === 7;
    const mon = addDays(start, w * 7);
    const fri = addDays(mon, 4);
    const bench = 185 + Math.floor(w / 2) * 5;
    lifts.push({
      workoutId: `m${w}`, date: mon, weekNumber: w + 1, isDeload: deload, prescriptionKey: "mon-bench-press", exerciseSlug: "bench-press",
      sets: (deload ? [6, 6] : [6, 6, 5 + (w % 2), 5]).map((reps, i) => ({ setNumber: i + 1, weight: deload ? bench - 20 : bench, reps })),
    });
    lifts.push({
      workoutId: `f${w}`, date: fri, weekNumber: w + 1, isDeload: deload, prescriptionKey: "fri-strict-pull-up", exerciseSlug: "strict-pull-up",
      sets: [0, 1, 2].map((i) => ({ setNumber: i + 1, weight: Math.max(0, 50 - w * 5), reps: 6 + Math.min(2, w % 3) })),
    });
    lifts.push({
      workoutId: `d${w}`, date: fri, weekNumber: w + 1, isDeload: deload, prescriptionKey: "fri-dip", exerciseSlug: "dip",
      sets: [0, 1, 2].map((i) => ({ setNumber: i + 1, weight: Math.max(0, 40 - w * 5), reps: 7 + (w % 3) })),
    });
    for (let d = 0; d < 5; d++) if (!(w === 2 && d === 3)) completed.push(addDays(mon, d));
    for (const [d, m] of [[0, 15 + w * 2], [2, 20 + w * 2], [4, 18 + w * 2], [5, 30 + w * 4]] as const) {
      cardio.push({ date: addDays(mon, d), actualMinutes: deload ? Math.round(m * 0.65) : m, rpe: 2 + ((w + d) % 3 === 0 ? 1 : 0) });
    }
  }
  return { lifts, cardio, completedLiftingDates: completed };
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

  if (view.startsWith("progress-")) {
    const sp = await searchParams;
    const data: ProgressData = view === "progress-empty" ? { lifts: [], cardio: [], completedLiftingDates: [] } : progressFixture();
    return (
      <>
        <TopBar />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[calc(6rem+env(safe-area-inset-bottom))]">
          <ProgressView
            block={block}
            data={data}
            startDate="2026-09-28"
            today="2026-11-18"
            currentWeek={8}
            lift={typeof sp.lift === "string" ? sp.lift : "bench-press"}
            rel={sp.rel === "dip" ? "dip" : "pull-up"}
            basePath={`/dev/gallery?view=${view}`}
          />
        </main>
        <BottomNav />
      </>
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
