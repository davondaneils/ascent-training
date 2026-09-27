import { Moon } from "lucide-react";
import { monthDay, weekdayName } from "@/lib/dates";
import type { CardioLogSummary, WorkoutStatus } from "@/lib/data/today";
import { formatPrescription } from "@/lib/training/format";
import { estimateDurationMinutes, type TodayResolution } from "@/lib/training/schedule";
import type { ProgramBlock } from "@/lib/training/types";
import { CardioCard } from "./cardio-card";
import { MobilityChecklist } from "./mobility-checklist";
import { WeekSummary } from "./week-summary";
import { WorkoutCard } from "./workout-card";

export interface TodayData {
  block: ProgramBlock;
  exerciseIds: Record<string, string>;
  userId: string;
  today: TodayResolution;
  workout: { id: string; status: WorkoutStatus } | null;
  cardioLogs: CardioLogSummary[];
  mobilityDone: string[];
  completion: { lifting: number; cardio: number };
  scheduled: { lifting: number; cardio: number };
}

/** Presentational Today screen: all four states (lifting day, Saturday, Sunday, before start). */
export function TodayView({ block, exerciseIds, userId, today, workout, cardioLogs, mobilityDone, completion, scheduled }: TodayData) {
  const header = (
    <div className="flex flex-col gap-1 pt-2">
      <h1 className="type-title">{weekdayName(today.date)}</h1>
      <p className="type-body text-text-secondary">
        {monthDay(today.date)}
        {today.status === "active" && (
          <>
            {" · "}Week {today.resolved.week} of {block.durationWeeks}
            {today.resolved.isDeload && " · Deload"}
          </>
        )}
      </p>
    </div>
  );

  if (today.status === "before_start") {
    return (
      <div className="flex flex-col gap-10">
        {header}
        <section className="flex flex-col gap-2">
          <p className="type-meta text-text-tertiary">{block.name}</p>
          <h2 className="type-heading">
            Starts {weekdayName(today.startDate)}, {monthDay(today.startDate)}
          </h2>
          <p className="type-body text-text-secondary">
            {today.daysUntilStart === 1 ? "Tomorrow." : `In ${today.daysUntilStart} days.`} Week 1 begins then.
          </p>
        </section>
      </div>
    );
  }

  const { resolved } = today;
  const { day } = resolved;

  if (day.sessionType === "rest") {
    return (
      <div className="flex flex-col gap-10">
        {header}
        <section className="flex flex-col items-start gap-3 pt-12">
          <Moon className="size-7 text-text-tertiary" strokeWidth={1.5} aria-hidden />
          <h2 className="type-title">Rest · Fast</h2>
          <p className="text-[17px] leading-relaxed text-text-secondary">
            No training today.
            <br />
            Resume Monday.
          </p>
        </section>
      </div>
    );
  }

  const exercise = (slug: string) => block.exercises.find((e) => e.slug === slug)!;

  return (
    <div className="flex flex-col gap-5">
      {header}

      {day.sessionType === "lifting" && (
        <WorkoutCard
          name={day.name}
          durationMinutes={estimateDurationMinutes(resolved)}
          isDeload={resolved.isDeload}
          workout={workout}
          exercises={resolved.exercises.map((p) => ({ key: p.key, exercise: exercise(p.exerciseSlug), detail: formatPrescription(p) }))}
        />
      )}

      {resolved.cardio && (
        <CardioCard cardio={resolved.cardio} date={today.date} primary={day.sessionType !== "lifting"} logs={cardioLogs} />
      )}

      {resolved.mobility.length > 0 && (
        <MobilityChecklist
          title="Checklist"
          date={today.date}
          userId={userId}
          initiallyDone={mobilityDone}
          items={resolved.mobility.map((p) => ({
            exerciseId: exerciseIds[p.exerciseSlug],
            name: exercise(p.exerciseSlug).name,
            detail: formatPrescription(p),
            notes: p.notes,
            holdSeconds: p.durationSeconds,
          }))}
        />
      )}

      <div className="pt-3">
        <WeekSummary
          lifting={{ done: completion.lifting, scheduled: scheduled.lifting }}
          cardio={{ done: completion.cardio, scheduled: scheduled.cardio }}
        />
      </div>
    </div>
  );
}
