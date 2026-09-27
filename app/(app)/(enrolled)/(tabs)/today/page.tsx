import { getAppContext } from "@/lib/data/context";
import { resolveToday } from "@/lib/training/schedule";

// Interim Today: proves the program + enrollment wiring. Full Today lands in slice 3.
export default async function TodayPage() {
  const { program, enrollment } = await getAppContext();
  const today = resolveToday(program.block, enrollment!, new Date());

  return (
    <section className="flex flex-col gap-2 pt-4">
      <p className="text-sm text-text-tertiary">{today.date}</p>
      {today.status === "before_start" ? (
        <h1 className="text-2xl font-semibold text-text-primary">Phase 1 begins {today.startDate}</h1>
      ) : (
        <>
          <p className="text-sm text-text-secondary">
            {program.block.name} · Week {today.resolved.week} of {program.block.durationWeeks}
          </p>
          <h1 className="text-2xl font-semibold text-text-primary">{today.resolved.day.name}</h1>
        </>
      )}
    </section>
  );
}
