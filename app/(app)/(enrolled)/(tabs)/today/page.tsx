import { TodayView } from "@/components/today/today-view";
import { campaignPosition, missionsForDate } from "@/lib/campaign/schedule";
import { getMissionLogsForDate } from "@/lib/data/campaign";
import { serverNow } from "@/lib/clock";
import { getAppContext } from "@/lib/data/context";
import {
  getCardioLogsForDate,
  getMobilityDoneForDate,
  getWeekCompletion,
  getWorkoutForDate,
} from "@/lib/data/today";
import { programWeekRange, resolveToday, scheduledCounts } from "@/lib/training/schedule";

export default async function TodayPage() {
  const { user, supabase, program, enrollment } = await getAppContext();
  const { block } = program;
  const today = resolveToday(block, enrollment!, await serverNow());
  const campaign = campaignPosition(enrollment!.startDate, today.date);

  const base = {
    block,
    exerciseIds: program.exerciseIds,
    userId: user.id,
    today,
    workout: null,
    cardioLogs: [],
    mobilityDone: [],
    completion: { lifting: 0, cardio: 0 },
    scheduled: { lifting: 0, cardio: 0 },
    campaign: { position: campaign, missions: missionsForDate(enrollment!.startDate, today.date), logs: [] },
  };
  if (today.status !== "active" || today.resolved.day.sessionType === "rest") return <TodayView {...base} />;

  const { resolved } = today;
  const range = programWeekRange(enrollment!.startDate, resolved.absoluteWeek);
  const [workout, cardioLogs, mobilityDone, completion, missionLogs] = await Promise.all([
    resolved.day.sessionType === "lifting"
      ? getWorkoutForDate(supabase, user.id, today.date, program.dayIds[resolved.dayOfWeek])
      : null,
    resolved.cardio ? getCardioLogsForDate(supabase, user.id, today.date) : [],
    resolved.mobility.length > 0 ? getMobilityDoneForDate(supabase, user.id, today.date) : new Set<string>(),
    getWeekCompletion(supabase, user.id, range.from, range.to),
    getMissionLogsForDate(supabase, user.id, today.date),
  ]);

  return (
    <TodayView
      {...base}
      workout={workout}
      cardioLogs={cardioLogs}
      mobilityDone={[...mobilityDone]}
      completion={completion}
      scheduled={scheduledCounts(block, resolved.week, resolved.wave)}
      campaign={{ ...base.campaign, logs: missionLogs }}
    />
  );
}
