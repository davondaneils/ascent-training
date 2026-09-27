import { Check } from "lucide-react";
import Link from "next/link";
import { Card, Eyebrow } from "@/components/shared/card";
import { Button } from "@/components/ui/button";
import type { WorkoutStatus } from "@/lib/data/today";

interface Props {
  name: string;
  exerciseCount: number;
  durationMinutes: number;
  isDeload: boolean;
  workout: { id: string; status: WorkoutStatus } | null;
}

export function WorkoutCard({ name, exerciseCount, durationMinutes, isDeload, workout }: Props) {
  const status = workout?.status;
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Eyebrow>{isDeload ? "Today · Deload" : "Today"}</Eyebrow>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">{name}</h2>
        <p className="text-[15px] text-text-secondary">
          {exerciseCount} exercises · ~{durationMinutes} min
        </p>
      </div>
      {status === "completed" ? (
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-[15px] font-medium text-success">
            <Check className="size-5" aria-hidden /> Workout complete
          </p>
          <Button asChild variant="ghost" size="touch">
            <Link href={`/workout/${workout!.id}`}>Summary</Link>
          </Button>
        </div>
      ) : (
        <Button asChild size="xl">
          <Link href="/workout/start">{status === "in_progress" ? "Resume Workout" : "Start Workout"}</Link>
        </Button>
      )}
    </Card>
  );
}
