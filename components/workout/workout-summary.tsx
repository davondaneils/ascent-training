import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatSetsCompact } from "@/lib/training/format";
import type { SessionSummary } from "@/lib/training/session";
import type { ExerciseInfo, WorkoutMeta } from "./types";

interface Props {
  meta: WorkoutMeta;
  summary: SessionSummary;
  infoByExercise: Record<string, ExerciseInfo>;
}

export function WorkoutSummary({ meta, summary, infoByExercise }: Props) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(2.5rem+env(safe-area-inset-top))]">
      <header className="flex flex-col gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-success text-white">
          <Check className="size-6" strokeWidth={2.5} aria-hidden />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Workout complete</h1>
        <div className="flex flex-col text-[17px] text-text-secondary">
          <span className="text-text-primary">{meta.dayName}</span>
          <span className="tabular-nums">
            {summary.exercisesPerformed} exercises · {summary.workingSets} working sets · {summary.durationMinutes} min
          </span>
        </div>
      </header>

      <ul className="flex flex-col divide-y divide-border-subtle rounded-[20px] border border-border-subtle bg-surface">
        {summary.exercises.map((e) => {
          const info = infoByExercise[e.id];
          return (
            <li key={e.id} className="flex flex-col gap-0.5 px-4 py-3">
              <span className="text-[15px] text-text-primary">{info?.name ?? e.exerciseSlug}</span>
              <span className="text-[15px] tabular-nums text-text-secondary">
                {info?.durationSeconds ? `${e.sets.length} × hold` : formatSetsCompact(e.sets, info?.loadType ?? "barbell")}
              </span>
            </li>
          );
        })}
      </ul>

      {meta.nextScheduled && (
        <section className="flex flex-col gap-1 px-1">
          <h2 className="text-[13px] font-medium text-text-tertiary">Next scheduled</h2>
          <p className="text-[17px]">{meta.nextScheduled}</p>
        </section>
      )}

      <div className="mt-auto flex flex-col gap-2">
        <Button asChild size="xl">
          <Link href="/today">Done</Link>
        </Button>
        <Button asChild variant="ghost" size="touch">
          <Link href="/progress">View Progress</Link>
        </Button>
      </div>
    </main>
  );
}
