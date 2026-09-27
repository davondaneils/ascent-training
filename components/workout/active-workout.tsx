"use client";

import { X } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MobilityChecklist, type ChecklistItem } from "@/components/today/mobility-checklist";
import { useNow } from "@/hooks/use-now";
import { useWorkoutSession } from "@/hooks/use-workout-session";
import { formatWeight } from "@/lib/progression";
import { formatRest, formatSet, formatSetsCompact } from "@/lib/training/format";
import { restProgress } from "@/lib/training/rest-timer";
import {
  getOverview,
  getSessionView,
  summarizeSession,
  type SessionExercise,
  type SessionSet,
  type WorkoutSession,
} from "@/lib/training/session";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./confirm-dialog";
import { ExerciseComplete } from "./exercise-complete";
import { ExerciseMedia } from "./exercise-media";
import { HoldTimer } from "./hold-timer";
import { OverviewDrawer } from "./overview-drawer";
import { RepsControl } from "./reps-control";
import { RestPanel } from "./rest-panel";
import { SetEditDialog } from "./set-edit-dialog";
import { SyncStatus } from "./sync-status";
import type { ExerciseInfo, WorkoutMeta } from "./types";
import { WeightControl } from "./weight-control";
import { WorkoutSummary } from "./workout-summary";

interface Props {
  initialSession: WorkoutSession;
  infos: Record<string, ExerciseInfo>; // by workout exercise id
  meta: WorkoutMeta;
  userId: string;
  exerciseIdBySlug: Record<string, string>;
  date: string;
  prep: ChecklistItem[];
  prepDone: string[];
}

const isWeighted = (info: ExerciseInfo) => info.loadType !== "bodyweight" && info.loadType !== "none";

function defaultWeight(ex: SessionExercise, info: ExerciseInfo): number | null {
  if (!isWeighted(info)) return null;
  const last = [...ex.sets].reverse().find((s) => s.weight !== null);
  if (last) return last.weight;
  if (info.recommendation.weight !== null) return info.recommendation.weight;
  return info.previous?.find((s) => s.weight !== null)?.weight ?? null;
}

function targetLine(info: ExerciseInfo, weight: number | null): string {
  const parts: string[] = [];
  if (isWeighted(info) && weight !== null) {
    parts.push(info.loadType === "assisted" ? (weight === 0 ? "No assistance" : `−${formatWeight(weight)} lb`) : `${formatWeight(weight)} lb`);
  }
  if (info.durationSeconds !== null) parts.push(`${info.durationSeconds} sec hold`);
  else if (info.repMin !== null && info.repMax !== null) {
    parts.push(`${info.repMin === info.repMax ? info.repMin : `${info.repMin}–${info.repMax}`} reps${info.perSide ? "/side" : ""}`);
  }
  return parts.join(" · ");
}

export function ActiveWorkout({ initialSession, infos, meta, userId, exerciseIdBySlug, date, prep, prepDone }: Props) {
  const router = useRouter();
  const [session, dispatch] = useWorkoutSession(initialSession, { userId, exerciseIdBySlug });
  const now = useNow(250);
  const view = getSessionView(session, now);
  const [editing, setEditing] = useState<{ set: SessionSet; exerciseId: string } | null>(null);
  const anySets = session.exercises.some((e) => e.sets.length > 0);
  const [prepDismissed, setPrepDismissed] = useState(false);

  useEffect(() => {
    if (session.status === "abandoned") router.replace("/today");
  }, [session.status, router]);

  const names = useMemo(
    () => Object.fromEntries(session.exercises.map((e) => [e.id, infos[e.id]?.name ?? e.exerciseSlug])),
    [session.exercises, infos],
  );

  if (session.status === "completed") {
    return <WorkoutSummary meta={meta} summary={summarizeSession(session, now)} infoByExercise={infos} />;
  }
  if (view.kind === "ended") return null;

  const exercise = view.exercise;
  const info = infos[exercise.id];
  const position = session.exercises.findIndex((e) => e.id === exercise.id) + 1;

  const lastSet = session.exercises
    .flatMap((e) => e.sets.map((s) => ({ set: s, exerciseId: e.id })))
    .sort((a, b) => b.set.completedAt - a.set.completedAt)[0];

  const showPrep = prep.length > 0 && !prepDismissed && !anySets;
  const viewKey = showPrep ? "prep" : `${view.kind}:${exercise.id}`;

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[env(safe-area-inset-top)]">
        <header className="flex h-14 shrink-0 items-center justify-between">
          <ConfirmDialog
            title="Leave workout?"
            description="Your progress is saved. Resume any time from Today."
            confirmLabel="Leave"
            cancelLabel="Stay"
            onConfirm={() => router.push("/today")}
          >
            <Button variant="ghost" size="icon-touch" className="-ml-2 text-text-secondary" aria-label="Leave workout">
              <X className="size-6" />
            </Button>
          </ConfirmDialog>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium tabular-nums text-text-secondary" aria-label={`Exercise ${position} of ${session.exercises.length}`}>
              {position} / {session.exercises.length}
            </span>
            <SyncStatus />
          </div>
          <OverviewDrawer
            rows={getOverview(session)}
            names={names}
            onJump={(id) => {
              setPrepDismissed(true);
              dispatch({ type: "jump", exerciseId: id });
            }}
            onFinish={() => dispatch({ type: "finish", now: Date.now() })}
            onDiscard={() => dispatch({ type: "abandon", now: Date.now() })}
          />
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-1 flex-col"
          >
            {showPrep ? (
              <div className="flex flex-1 flex-col gap-5 pb-32 pt-2">
                <div className="flex flex-col gap-1">
                  <p className="text-[13px] font-medium text-text-tertiary">Before you start</p>
                  <h1 className="text-[28px] font-semibold leading-tight tracking-tight">Warm-up</h1>
                </div>
                <MobilityChecklist title={meta.dayName} date={date} userId={userId} items={prep} initiallyDone={prepDone} />
                <BottomBar>
                  <Button size="xl" onClick={() => setPrepDismissed(true)}>
                    Start {names[session.exercises[0].id]}
                  </Button>
                </BottomBar>
              </div>
            ) : view.kind === "resting" ? (
              <RestPanel
                remainingMs={view.remainingMs}
                progress={session.rest ? restProgress(session.rest, now) : 1}
                completedSummary={
                  lastSet ? `Set ${lastSet.set.setNumber} — ${formatSet(lastSet.set, infos[lastSet.exerciseId].loadType)}` : ""
                }
                nextTarget={`${exercise.sets.length > 0 ? "" : `${info.name} · `}${targetLine(info, defaultWeight(exercise, info))}`}
                onExtend={() => dispatch({ type: "extend_rest", now: Date.now() })}
                onSkip={() => dispatch({ type: "skip_rest", now: Date.now() })}
                onEditLast={() => lastSet && setEditing(lastSet)}
              />
            ) : view.kind === "exercise_complete" ? (
              <ExerciseComplete
                name={info.name}
                summary={info.durationSeconds ? `${exercise.sets.length} holds` : formatSetsCompact(exercise.sets, info.loadType)}
                next={view.next ? infos[view.next.id] : null}
                restRemainingMs={view.remainingMs}
                onContinue={() => dispatch({ type: "continue" })}
                onFinish={() => dispatch({ type: "finish", now: Date.now() })}
              />
            ) : (
              <SetEntry
                key={`${exercise.id}:${view.setNumber}`}
                exercise={exercise}
                info={info}
                setNumber={view.setNumber}
                onEdit={(set) => setEditing({ set, exerciseId: exercise.id })}
                onComplete={(weight, reps) =>
                  dispatch({ type: "complete_set", setId: crypto.randomUUID(), weight, reps, now: Date.now() })
                }
              />
            )}
          </motion.div>
        </AnimatePresence>

        {editing && (
          <SetEditDialog
            set={editing.set}
            info={infos[editing.exerciseId]}
            onSave={(weight, reps) => dispatch({ type: "edit_set", setId: editing.set.id, weight, reps })}
            onClose={() => setEditing(null)}
          />
        )}
      </div>
    </MotionConfig>
  );
}

function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-background px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
      <div className="mx-auto max-w-md">{children}</div>
    </div>
  );
}

interface SetEntryProps {
  exercise: SessionExercise;
  info: ExerciseInfo;
  setNumber: number;
  onEdit: (set: SessionSet) => void;
  onComplete: (weight: number | null, reps: number | null) => void;
}

function SetEntry({ exercise, info, setNumber, onEdit, onComplete }: SetEntryProps) {
  const weighted = isWeighted(info);
  const timed = info.durationSeconds !== null;
  const [weight, setWeight] = useState<number | null>(() => defaultWeight(exercise, info));
  const [reps, setReps] = useState<number | null>(null);
  const canComplete = (timed || reps !== null) && (!weighted || weight !== null);

  return (
    <div className="flex flex-1 flex-col gap-5 pb-32 pt-1">
      <div className="flex flex-col gap-3">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{info.name}</h1>
        <ExerciseMedia info={info} />
        <p className="text-[17px] tabular-nums text-text-primary">
          {info.prescriptionText}
          <span className="text-text-secondary">
            {" · "}
            {info.restSeconds !== null ? `Rest ${formatRest(info.restSeconds)}` : "Rest as needed"}
          </span>
        </p>
        <div className="flex flex-col gap-0.5 text-[15px]">
          {info.previous && info.previous.length > 0 ? (
            <p className="text-text-secondary">
              <span className="text-text-tertiary">Previous </span>
              <span className="tabular-nums">
                {timed ? `${info.previous.length} holds` : info.previous.map((s) => formatSet(s, info.loadType).replace(" × ", "×")).join(" · ")}
              </span>
            </p>
          ) : (
            <p className="text-text-tertiary">First session</p>
          )}
          {info.recommendation.reason && info.recommendation.kind !== "first_session" && (
            <p className="text-text-tertiary">{info.recommendation.reason}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 border-t border-border-subtle pt-5">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold tabular-nums">
            Set {setNumber} of {exercise.targetSets}
          </p>
          {exercise.sets.length > 0 && (
            <div className="flex gap-1.5">
              {exercise.sets.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onEdit(s)}
                  aria-label={`Edit set ${s.setNumber}`}
                  className="h-9 rounded-full bg-surface-subtle px-3 text-[13px] tabular-nums text-text-secondary"
                >
                  {timed ? `✓ ${s.setNumber}` : formatSet(s, info.loadType).replace(" × ", "×")}
                </button>
              ))}
            </div>
          )}
        </div>

        {weighted && <WeightControl value={weight} onChange={setWeight} step={info.loadIncrement ?? 5} loadType={info.loadType} />}
        {timed ? (
          <HoldTimer seconds={info.durationSeconds!} perSide={info.perSide} />
        ) : (
          info.repMin !== null &&
          info.repMax !== null && (
            <RepsControl value={reps} onChange={setReps} repMin={info.repMin} repMax={info.repMax} perSide={info.perSide} />
          )
        )}
      </div>

      <BottomBar>
        <Button size="xl" disabled={!canComplete} onClick={() => onComplete(weighted ? weight : null, timed ? null : reps)} className={cn(!canComplete && "opacity-40")}>
          Complete Set
        </Button>
      </BottomBar>
    </div>
  );
}
