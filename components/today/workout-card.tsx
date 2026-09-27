import { Check } from "lucide-react";
import Link from "next/link";
import { startWorkout } from "@/app/(app)/(enrolled)/workout/actions";
import { Card, Eyebrow } from "@/components/shared/card";
import { Button } from "@/components/ui/button";
import { ExerciseThumb } from "@/components/workout/exercise-media";
import type { WorkoutStatus } from "@/lib/data/today";
import type { Exercise } from "@/lib/training/types";

export interface PreviewExercise {
  key: string;
  exercise: Exercise;
  detail: string; // "4 × 4–6"
}

interface Props {
  name: string;
  durationMinutes: number;
  isDeload: boolean;
  exercises: PreviewExercise[];
  workout: { id: string; status: WorkoutStatus } | null;
}

const PREVIEW = 4;

export function WorkoutCard({ name, durationMinutes, isDeload, exercises, workout }: Props) {
  const status = workout?.status;
  const rest = exercises.length - PREVIEW;
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Eyebrow>{isDeload ? "Lifting · Deload week" : "Lifting"}</Eyebrow>
        <h2 className="type-heading">{name}</h2>
        <p className="type-body tabular-nums text-text-secondary">
          {exercises.length} exercises · ~{durationMinutes} min
        </p>
      </div>

      <ul className="flex flex-col gap-2.5">
        {exercises.slice(0, PREVIEW).map((p) => (
          <li key={p.key} className="flex items-center gap-3">
            <ExerciseThumb info={p.exercise} className="size-11" />
            <span className="flex-1 truncate text-[15px] text-text-primary">{p.exercise.name}</span>
            <span className="text-[15px] tabular-nums text-text-tertiary">{p.detail}</span>
          </li>
        ))}
        {rest > 0 && <li className="pl-14 type-meta text-text-tertiary">+{rest} more</li>}
      </ul>

      {status === "completed" ? (
        <div className="flex items-center justify-between border-t border-border-subtle pt-4">
          <p className="flex items-center gap-2 type-body font-medium text-success">
            <Check className="size-5" aria-hidden /> Workout complete
          </p>
          <Button asChild variant="ghost" size="touch">
            <Link href={`/workout/${workout!.id}`}>Summary</Link>
          </Button>
        </div>
      ) : (
        <form action={startWorkout}>
          <Button type="submit" size="xl">
            {status === "in_progress" ? "Resume Workout" : "Start Workout"}
          </Button>
        </form>
      )}
    </Card>
  );
}
