import { ChevronLeft } from "lucide-react";
import { serverNow } from "@/lib/clock";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toLocalDate } from "@/lib/dates";
import { getAppContext } from "@/lib/data/context";
import { applyDeload, isDeloadWeek } from "@/lib/training/deload";
import { formatMinutes, formatPrescription, formatRest } from "@/lib/training/format";
import { getCardio, programPosition } from "@/lib/training/schedule";
import type { DayOfWeek, Prescription } from "@/lib/training/types";

export default async function PlanDayPage({ params, searchParams }: PageProps<"/plan/[day]">) {
  const { program, enrollment } = await getAppContext();
  const { block } = program;
  const dow = Number((await params).day);
  if (!Number.isInteger(dow) || dow < 1 || dow > 7) notFound();

  const position = programPosition(block, enrollment!, toLocalDate(await serverNow()));
  const requested = Number((await searchParams).week);
  const week =
    Number.isInteger(requested) && requested >= 1 && requested <= block.durationWeeks
      ? requested
      : position.status === "active" ? position.week : 1;

  const day = block.days.find((d) => d.dayOfWeek === dow)!;
  const deload = isDeloadWeek(block, week);
  const prescriptions = day.prescriptions.map((p) => (deload ? applyDeload(p) : p));
  const cardio = dow === 7 ? null : getCardio(block, week, dow as DayOfWeek);
  const name = (slug: string) => block.exercises.find((e) => e.slug === slug)?.name ?? slug;

  const sections: { title: string; items: Prescription[] }[] = [
    { title: "Warm-up", items: prescriptions.filter((p) => p.section === "prep") },
    { title: "Exercises", items: prescriptions.filter((p) => p.section === "main") },
    { title: "Mobility", items: prescriptions.filter((p) => p.section === "mobility") },
  ].filter((s) => s.items.length > 0);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pb-12 pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 items-center">
        <Link
          href={`/plan?week=${week}`}
          aria-label="Back to plan"
          className="-ml-3 flex size-11 items-center justify-center rounded-full text-text-secondary"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Link>
      </header>

      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-medium text-text-tertiary">
          Week {week}
          {deload && " · Deload"}
        </p>
        <h1 className="text-title">{day.fullName}</h1>
        {day.notes && <p className="pt-1 text-[15px] text-text-secondary">{day.notes}</p>}
      </div>

      {sections.map((s) => (
        <section key={s.title} className="flex flex-col gap-2">
          <h2 className="px-1 text-[13px] font-medium text-text-tertiary">{s.title}</h2>
          <ol className="flex flex-col divide-y divide-border-subtle rounded-[20px] border border-border-subtle bg-surface">
            {s.items.map((p) => (
              <li key={p.key} className="flex flex-col gap-0.5 px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] text-text-primary">{name(p.exerciseSlug)}</span>
                  <span className="shrink-0 text-[15px] tabular-nums text-text-secondary">{formatPrescription(p)}</span>
                </div>
                {(p.restSeconds !== null || p.notes) && (
                  <p className="text-[13px] text-text-tertiary">
                    {p.restSeconds !== null && `Rest ${formatRest(p.restSeconds)}`}
                    {p.restSeconds !== null && p.notes && " · "}
                    {p.notes}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}

      {cardio && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-[13px] font-medium text-text-tertiary">Cardio</h2>
          <div className="rounded-[20px] border border-border-subtle bg-surface px-4 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px]">Bike</span>
              <span className="text-[15px] tabular-nums text-text-secondary">
                {formatMinutes(cardio.targetMinutes, cardio.targetMinutesMax)}
              </span>
            </div>
            <p className="text-[13px] text-text-tertiary">
              RPE {cardio.targetRpeMin}–{cardio.targetRpeMax}
              {cardio.notes && ` · ${cardio.notes}`}
            </p>
          </div>
        </section>
      )}

      {dow === 7 && <p className="text-[17px] text-text-secondary">No training. Rest and fast.</p>}
    </main>
  );
}
