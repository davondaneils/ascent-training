import { ChevronRight } from "lucide-react";
import { serverNow } from "@/lib/clock";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { WeekStrip } from "@/components/plan/week-strip";
import { shortWeekday, toLocalDate } from "@/lib/dates";
import { getAppContext } from "@/lib/data/context";
import { formatMinutes } from "@/lib/training/format";
import { getCardio, programPosition } from "@/lib/training/schedule";

export default async function PlanPage({ searchParams }: PageProps<"/plan">) {
  const { program, enrollment } = await getAppContext();
  const { block } = program;
  const position = programPosition(block, enrollment!, toLocalDate(await serverNow()));
  const currentWeek = position.status === "active" ? position.week : null;

  const requested = Number((await searchParams).week);
  const selectedWeek =
    Number.isInteger(requested) && requested >= 1 && requested <= block.durationWeeks ? requested : (currentWeek ?? 1);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-col gap-3">
        <h1 className="text-title">{block.name}</h1>
        <p className="text-[15px] text-text-secondary">
          {currentWeek ? `Week ${currentWeek} of ${block.durationWeeks}` : `Starts ${enrollment!.startDate}`}
        </p>
        <Progress
          value={currentWeek ? (currentWeek / block.durationWeeks) * 100 : 0}
          aria-label="Block progress"
          className="h-1.5"
        />
      </header>

      <WeekStrip
        weeks={block.durationWeeks}
        currentWeek={currentWeek}
        selectedWeek={selectedWeek}
        deloadWeeks={block.deloadWeeks}
      />

      <section aria-label={`Week ${selectedWeek}`} className="flex flex-col">
        <h2 className="px-1 pb-2 text-meta text-text-tertiary">
          Week {selectedWeek}
          {block.deloadWeeks.includes(selectedWeek) && " · Deload"}
        </h2>
        <ul className="flex flex-col divide-y divide-border-subtle rounded-[20px] border border-border-subtle bg-surface">
          {block.days.map((d) => {
            const cardio = d.dayOfWeek === 7 ? null : getCardio(block, selectedWeek, d.dayOfWeek);
            return (
              <li key={d.dayOfWeek}>
                <Link
                  href={`/plan/${d.dayOfWeek}?week=${selectedWeek}`}
                  className="flex min-h-16 items-center gap-4 px-4 py-3 active:bg-surface-subtle"
                >
                  <span className="w-9 text-meta text-text-tertiary">{shortWeekday(d.dayOfWeek)}</span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-[15px] text-text-primary">{d.name}</span>
                    {cardio && (
                      <span className="text-meta font-normal text-text-tertiary">
                        {d.sessionType === "lifting" ? "+ " : ""}Bike {formatMinutes(cardio.targetMinutes, cardio.targetMinutesMax)}
                      </span>
                    )}
                  </span>
                  <ChevronRight className="size-4 text-text-tertiary" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
