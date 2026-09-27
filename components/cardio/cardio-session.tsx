"use client";

import { Bike, Footprints, X } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { ProgressRing } from "@/components/shared/progress-ring";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/workout/confirm-dialog";
import { SyncStatus } from "@/components/workout/sync-status";
import { useCardioSession } from "@/hooks/use-cardio-session";
import { useNow } from "@/hooks/use-now";
import { getOutbox } from "@/lib/offline/client-outbox";
import { actualMinutes, cardioElapsedMs, createCardioSession } from "@/lib/training/cardio";
import { formatMinutes } from "@/lib/training/format";
import { formatClock } from "@/lib/training/rest-timer";
import type { CardioModality, CardioPrescription } from "@/lib/training/types";
import { cn } from "@/lib/utils";

const MODALITY: Record<CardioModality, { label: string; Icon: typeof Bike }> = {
  bike: { label: "Bike", Icon: Bike },
  incline_walk: { label: "Incline walk", Icon: Footprints },
};

interface Props {
  logId: string;
  date: string;
  weekNumber: number;
  blockId: string;
  userId: string;
  prescription: CardioPrescription;
  allowModalityChoice: boolean;
  isDeload: boolean;
  /** Gallery/preview: no writes. */
  persist?: boolean;
}

export function CardioSessionView({ logId, date, weekNumber, blockId, userId, prescription, allowModalityChoice, isDeload, persist = true }: Props) {
  const router = useRouter();
  const [session, dispatch, restored] = useCardioSession(
    createCardioSession({ logId, date, modality: prescription.modality, targetMinutes: prescription.targetMinutes }),
  );
  const ticking = session.phase === "running";
  const now = useNow(250, ticking) ?? session.stopwatch?.runningSince ?? 0;
  const elapsed = cardioElapsedMs(session, now);
  const targetMs = session.targetMinutes * 60_000;
  const left = Math.max(0, targetMs - elapsed);
  const target = formatMinutes(prescription.targetMinutes, prescription.targetMinutesMax);
  const { label, Icon } = MODALITY[session.modality];

  if (!restored) return <div className="min-h-dvh" aria-busy="true" />;

  function saveLog() {
    const next = dispatch({ type: "saved" });
    if (next.phase !== "saved" || next.rpe === null) return;
    if (persist) {
      const box = getOutbox();
      box.enqueue({
        kind: "upsert_cardio",
        row: {
          id: next.logId,
          user_id: userId,
          program_block_id: blockId,
          week_number: weekNumber,
          scheduled_date: date,
          modality: next.modality,
          target_minutes: next.targetMinutes,
          actual_minutes: actualMinutes(cardioElapsedMs(next, Date.now())),
          rpe: next.rpe,
          completed_at: new Date().toISOString(),
        },
      });
      void box.flush();
    }
    router.push("/today");
    router.refresh();
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
        <header className="flex h-14 shrink-0 items-center justify-between">
          {session.phase === "ready" ? (
            <Button variant="ghost" size="icon-touch" className="-ml-2 text-text-secondary" aria-label="Back to Today" onClick={() => router.push("/today")}>
              <X className="size-6" />
            </Button>
          ) : (
            <ConfirmDialog
              title="Leave cardio?"
              description="The timer keeps its place. Come back from Today to finish."
              confirmLabel="Leave"
              cancelLabel="Stay"
              onConfirm={() => router.push("/today")}
            >
              <Button variant="ghost" size="icon-touch" className="-ml-2 text-text-secondary" aria-label="Leave cardio">
                <X className="size-6" />
              </Button>
            </ConfirmDialog>
          )}
          {persist && <SyncStatus />}
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={session.phase === "paused" ? "running" : session.phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-1 flex-col"
          >
            {session.phase === "ready" && (
              <div className="flex flex-1 flex-col justify-between gap-8">
                <div className="flex flex-col gap-6 pt-6">
                  <div className="flex flex-col gap-2">
                    <p className="type-meta text-text-tertiary">
                      Cardio · Week {weekNumber}
                      {isDeload && " · Deload"}
                    </p>
                    <h1 className="flex items-center gap-3 type-title">
                      <Icon className="size-8 text-text-secondary" strokeWidth={1.75} aria-hidden />
                      {label}
                    </h1>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="type-display">{target}</p>
                    <p className="type-body text-text-secondary">
                      Easy · Target RPE {prescription.targetRpeMin}–{prescription.targetRpeMax}
                    </p>
                  </div>
                  {prescription.notes && <p className="type-body text-text-secondary">{prescription.notes}</p>}
                  {allowModalityChoice && (
                    <div role="radiogroup" aria-label="Modality" className="grid grid-cols-2 gap-2">
                      {(Object.keys(MODALITY) as CardioModality[]).map((m) => {
                        const M = MODALITY[m];
                        const on = session.modality === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => dispatch({ type: "set_modality", modality: m })}
                            className={cn(
                              "flex h-14 items-center justify-center gap-2 rounded-2xl border text-[15px] font-medium transition-colors",
                              on ? "border-accent bg-accent-soft text-accent" : "border-border-subtle bg-surface text-text-primary",
                            )}
                          >
                            <M.Icon className="size-5" aria-hidden />
                            {M.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <Button size="xl" onClick={() => dispatch({ type: "start", now: Date.now() })}>
                  Start
                </Button>
              </div>
            )}

            {(session.phase === "running" || session.phase === "paused") && (
              <div className="flex flex-1 flex-col items-center justify-between gap-6 pt-4">
                <p className="type-meta text-text-tertiary">
                  {label} · {target} · RPE {prescription.targetRpeMin}–{prescription.targetRpeMax}
                </p>
                <ProgressRing progress={elapsed / targetMs} radius={128}>
                  <p className="type-meta tracking-wide text-text-tertiary">{session.phase === "paused" ? "PAUSED" : "ELAPSED"}</p>
                  <p className={cn("type-timer", session.phase === "paused" && "text-text-secondary")} role="timer" aria-live="off">
                    {formatClock(elapsed)}
                  </p>
                  <p className="type-body tabular-nums text-text-secondary">
                    {left > 0 ? `${formatClock(left)} left` : "Target reached"}
                  </p>
                </ProgressRing>
                <div className="flex w-full flex-col gap-3">
                  <Button
                    variant="secondary"
                    size="touch"
                    className="h-14 w-full rounded-2xl text-base"
                    onClick={() => dispatch({ type: session.phase === "running" ? "pause" : "resume", now: Date.now() })}
                  >
                    {session.phase === "running" ? "Pause" : "Resume"}
                  </Button>
                  {left > 0 ? (
                    <ConfirmDialog
                      title="End early?"
                      description={`You've done ${formatClock(elapsed)} of ${session.targetMinutes} min. That's fine if you need to stop.`}
                      confirmLabel="End"
                      cancelLabel="Keep going"
                      onConfirm={() => dispatch({ type: "finish", now: Date.now() })}
                    >
                      <Button size="xl">Finish</Button>
                    </ConfirmDialog>
                  ) : (
                    <Button size="xl" onClick={() => dispatch({ type: "finish", now: Date.now() })}>
                      Finish
                    </Button>
                  )}
                </div>
              </div>
            )}

            {session.phase === "rating" && (
              <div className="flex flex-1 flex-col justify-between gap-8 pt-6">
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-2">
                    <p className="type-meta text-text-tertiary">
                      {label} · {actualMinutes(elapsed)} min
                    </p>
                    <h1 className="type-title">How hard?</h1>
                    <p className="type-body text-text-secondary">Rate the whole session, 1 (very easy) to 10 (max).</p>
                  </div>
                  <div role="radiogroup" aria-label="RPE" className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={session.rpe === n}
                        onClick={() => dispatch({ type: "rate", rpe: n })}
                        className={cn(
                          "flex h-14 items-center justify-center rounded-2xl text-xl font-semibold tabular-nums transition-colors",
                          session.rpe === n ? "bg-accent text-accent-foreground" : "border border-border-subtle bg-surface text-text-primary",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="xl" disabled={session.rpe === null} onClick={saveLog} className={cn(session.rpe === null && "opacity-40")}>
                    Save
                  </Button>
                  <Button variant="ghost" size="touch" onClick={() => dispatch({ type: "back_to_timer", now: Date.now() })}>
                    Back to timer
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
