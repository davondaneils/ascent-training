import { ProgressView } from "@/components/progress/progress-view";
import { CampaignProgress } from "@/components/campaign/campaign-progress";
import { campaignPosition, scheduledMissionCount } from "@/lib/campaign/schedule";
import { getMissionLogsForRange, getCapabilityTests } from "@/lib/data/campaign";
import { startOfWeek } from "@/lib/dates";
import { serverNow } from "@/lib/clock";
import { toLocalDate } from "@/lib/dates";
import { getAppContext } from "@/lib/data/context";
import { STRENGTH_LIFTS, loadProgressData } from "@/lib/data/progress";
import { programPosition } from "@/lib/training/schedule";

export default async function ProgressPage({ searchParams }: PageProps<"/progress">) {
  const { user, supabase, program, enrollment, trainingEnrollment } = await getAppContext();
  const sp = await searchParams;
  const today = toLocalDate(await serverNow());
  const position = programPosition(program.block, trainingEnrollment!, today);
  const weekStart = startOfWeek(today);
  const [data, missionLogs, capabilityTests] = await Promise.all([
    loadProgressData(supabase, program, user.id),
    getMissionLogsForRange(supabase, user.id, weekStart, today),
    getCapabilityTests(supabase, user.id),
  ]);

  const lift = (STRENGTH_LIFTS as readonly string[]).includes(String(sp.lift)) ? String(sp.lift) : "bench-press";
  const rel = String(sp.rel) === "dip" ? "dip" : "pull-up";

  return (
    <>
    <CampaignProgress
      position={campaignPosition(enrollment!.startDate, today)}
      completedThisWeek={missionLogs.filter((log) => log.status === "completed").length}
      scheduledThisWeek={scheduledMissionCount(enrollment!.startDate, weekStart, today)}
      needsWork={missionLogs.filter((log) => log.status === "needs_work").length}
      tests={capabilityTests}
    />
    <ProgressView
      block={program.block}
      data={data}
      startDate={trainingEnrollment!.startDate}
      today={today}
      currentWeek={position.status === "active" ? position.absoluteWeek : null}
      lift={lift}
      rel={rel}
      basePath="/progress"
    />
    </>
  );
}
