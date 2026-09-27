import { Moon } from "lucide-react";
import { serverNow } from "@/lib/clock";
import { CardioCard } from "@/components/today/cardio-card";
import { MobilityChecklist } from "@/components/today/mobility-checklist";
import { WeekSummary } from "@/components/today/week-summary";
import { WorkoutCard } from "@/components/today/workout-card";
import { monthDay, weekdayName } from "@/lib/dates";
import { getAppContext } from "@/lib/data/context";
import {
  getCardioLogsForDate,
  getMobilityDoneForDate,
  getWeekCompletion,
  getWorkoutForDate,
} from "@/lib/data/today";
import { formatPrescription } from "@/lib/training/format";
import {
  estimateDurationMinutes,
  programWeekRange,
  resolveToday,
  scheduledCounts,
} from "@/lib/training/schedule";

export default async function TodayPage() {
  const { user, supabase, program, enrollment } = await getAppContext();
  const { block } = program;
  const today = resolveToday(block, enrollment!, await serverNow());

  const dateHeader = (
    <div className="flex flex-col gap-1 pt-2">
      <h1 className="text-[34px] font-semibold leading-tight tracking-tight text-text-primary">
        {weekdayName(today.date)}
      </h1>
      <p className="text-[15px] text-text-secondary">{monthDay(today.date)}</p>
    </div>
  );

  if (today.status === "before_start") {
    return (
      <div className="flex flex-col gap-8">
        {dateHeader}
        <section className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-text-tertiary">{block.name}</p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Starts {weekdayName(today.startDate)}, {monthDay(today.startDate)}
          </h2>
          <p className="text-[15px] text-text-secondary">
            {today.daysUntilStart === 1 ? "Tomorrow." : `In ${today.daysUntilStart} days.`} Week 1 begins then.
          </p>
        </section>
      </div>
    );
  }

  const { resolved } = today;
  const { day, week, isDeload } = resolved;

  const phaseLine = (
    <p className="text-[15px] text-text-secondary">
      {block.name} · Week {week} of {block.durationWeeks}
      {isDeload && " · Deload"}
    </p>
  );

  if (day.sessionType === "rest") {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          {dateHeader}
          {phaseLine}
        </div>
        <section className="flex flex-col items-start gap-3 pt-10">
          <Moon className="size-7 text-text-tertiary" strokeWidth={1.5} aria-hidden />
          <h2 className="text-3xl font-semibold tracking-tight">Rest · Fast</h2>
          <p className="text-[17px] leading-relaxed text-text-secondary">
            No training today.
            <br />
            Resume Monday.
          </p>
        </section>
      </div>
    );
  }

  const dayId = program.dayIds[resolved.dayOfWeek];
  const range = programWeekRange(enrollment!.startDate, week);
  const counts = scheduledCounts(block, week);

  const [workout, cardioLogs, mobilityDone, completion] = await Promise.all([
    day.sessionType === "lifting" ? getWorkoutForDate(supabase, user.id, today.date, dayId) : null,
    resolved.cardio ? getCardioLogsForDate(supabase, user.id, today.date) : [],
    resolved.mobility.length > 0 ? getMobilityDoneForDate(supabase, user.id, today.date) : new Set<string>(),
    getWeekCompletion(supabase, user.id, range.from, range.to),
  ]);

  const exerciseName = (slug: string) => block.exercises.find((e) => e.slug === slug)?.name ?? slug;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {dateHeader}
        {phaseLine}
      </div>

      {day.sessionType === "lifting" && (
        <WorkoutCard
          name={day.name}
          exerciseCount={resolved.exercises.length}
          durationMinutes={estimateDurationMinutes(resolved)}
          isDeload={isDeload}
          workout={workout}
        />
      )}

      {resolved.cardio && (
        <CardioCard
          cardio={resolved.cardio}
          date={today.date}
          primary={day.sessionType !== "lifting"}
          logs={cardioLogs}
        />
      )}

      {resolved.mobility.length > 0 && (
        <MobilityChecklist
          title="Checklist"
          date={today.date}
          userId={user.id}
          initiallyDone={[...mobilityDone]}
          items={resolved.mobility.map((p) => ({
            exerciseId: program.exerciseIds[p.exerciseSlug],
            name: exerciseName(p.exerciseSlug),
            detail: formatPrescription(p),
            notes: p.notes,
          }))}
        />
      )}

      <WeekSummary
        lifting={{ done: completion.lifting, scheduled: counts.lifting }}
        cardio={{ done: completion.cardio, scheduled: counts.cardio }}
      />
    </div>
  );
}
