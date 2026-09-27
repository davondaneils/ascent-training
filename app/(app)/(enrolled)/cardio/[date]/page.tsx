import { Check } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CardioSessionView } from "@/components/cardio/cardio-session";
import { Button } from "@/components/ui/button";
import { serverNow } from "@/lib/clock";
import { getAppContext } from "@/lib/data/context";
import { getCardioLogsForDate } from "@/lib/data/today";
import { resolveToday } from "@/lib/training/schedule";

export default async function CardioPage({ params }: PageProps<"/cardio/[date]">) {
  const { date } = await params;
  const { user, supabase, program, enrollment } = await getAppContext();
  const today = resolveToday(program.block, enrollment!, await serverNow());

  // Cardio is logged for today's prescription only.
  if (today.status !== "active" || today.date !== date || !today.resolved.cardio) redirect("/today");
  const { resolved } = today;

  const logs = await getCardioLogsForDate(supabase, user.id, date);
  if (logs.length > 0) {
    const log = logs[0];
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))]">
        <div className="flex flex-col gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-success text-white">
            <Check className="size-6" strokeWidth={2.5} aria-hidden />
          </div>
          <h1 className="type-title">Cardio done</h1>
          <p className="type-body tabular-nums text-text-secondary">
            {log.actualMinutes} min · RPE {log.rpe}
          </p>
        </div>
        <Button asChild size="xl" className="mt-auto">
          <Link href="/today">Done</Link>
        </Button>
      </main>
    );
  }

  return (
    <CardioSessionView
      logId={crypto.randomUUID()}
      date={date}
      weekNumber={resolved.week}
      blockId={program.blockId}
      userId={user.id}
      prescription={resolved.cardio!}
      allowModalityChoice={resolved.dayOfWeek === 6}
      isDeload={resolved.isDeload}
    />
  );
}
