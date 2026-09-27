import { ProgressView } from "@/components/progress/progress-view";
import { serverNow } from "@/lib/clock";
import { toLocalDate } from "@/lib/dates";
import { getAppContext } from "@/lib/data/context";
import { STRENGTH_LIFTS, loadProgressData } from "@/lib/data/progress";
import { programPosition } from "@/lib/training/schedule";

export default async function ProgressPage({ searchParams }: PageProps<"/progress">) {
  const { user, supabase, program, enrollment } = await getAppContext();
  const sp = await searchParams;
  const today = toLocalDate(await serverNow());
  const position = programPosition(program.block, enrollment!, today);
  const data = await loadProgressData(supabase, program, user.id);

  const lift = (STRENGTH_LIFTS as readonly string[]).includes(String(sp.lift)) ? String(sp.lift) : "bench-press";
  const rel = String(sp.rel) === "dip" ? "dip" : "pull-up";

  return (
    <ProgressView
      block={program.block}
      data={data}
      startDate={enrollment!.startDate}
      today={today}
      currentWeek={position.status === "active" ? position.week : null}
      lift={lift}
      rel={rel}
      basePath="/progress"
    />
  );
}
