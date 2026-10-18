import Link from "next/link";
import { CheckCircle2, CircleDot } from "lucide-react";
import { CAMPAIGN_CYCLES } from "@/lib/campaign/roadmap";
import type { CampaignPosition } from "@/lib/campaign/schedule";

export function CampaignRoadmap({ position }: { position: CampaignPosition }) {
  return (
    <div className="flex flex-col gap-7 pt-2">
      <Link href="/plan" className="text-[14px] text-accent">← Training plan</Link>
      <header className="flex flex-col gap-3">
        <p className="type-meta text-text-tertiary">ASCENT · FIVE YEARS TO PREPARE</p>
        <h1 className="type-title">The Campaign</h1>
        <p className="type-body text-text-secondary">
          The risk of religious persecution or collapse gives the training its stakes. It is a
          hypothetical, not a forecast. The mission is to protect life, serve people, and remain faithful.
        </p>
        <p className="type-body text-text-secondary">
          {position.status === "complete" ? "Five-year horizon complete. Retest and continue serving." :
            position.status === "before_start" ? "Your campaign begins with your training enrollment." :
              `Day ${position.dayNumber} of ${position.totalDays} · Year ${position.year} of 5 · Cycle ${position.cycleNumber} of 20`}
        </p>
      </header>
      {Array.from({ length: 5 }, (_, i) => i + 1).map((year) => (
        <section key={year} className="flex flex-col gap-3">
          <h2 className="type-heading">Year {year}</h2>
          <div className="divide-y divide-border-subtle overflow-hidden rounded-[20px] border border-border-subtle bg-surface">
            {CAMPAIGN_CYCLES.filter((cycle) => cycle.year === year).map((cycle) => {
              const index = CAMPAIGN_CYCLES.indexOf(cycle);
              const past = position.status === "complete" || (position.status === "active" && index < position.cycleIndex);
              const current = position.status === "active" && index === position.cycleIndex;
              return (
                <div key={cycle.id} className="flex items-start gap-3 p-4">
                  {past ? <CheckCircle2 className="mt-1 size-5 shrink-0 text-text-tertiary" aria-label="Time elapsed" /> :
                    current ? <CircleDot className="mt-1 size-5 shrink-0 text-accent" aria-label="Current cycle" /> :
                      <span className="mt-1 flex size-5 shrink-0 items-center justify-center text-[12px] text-text-tertiary">{cycle.quarter}</span>}
                  <div className="flex flex-1 flex-col gap-2">
                    <h3 className="type-subheading">{cycle.title}</h3>
                    <p className="text-[14px] text-text-secondary">{cycle.capability}</p>
                    <p className="text-[13px] text-text-tertiary">Crucible: {cycle.capstone}</p>
                    {current && <p className="type-meta text-accent">CURRENT · WEEK {position.weekInCycle} OF 13</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <p className="text-[13px] text-text-tertiary">
        An elapsed cycle does not mean competence was achieved. Progress is established by recorded demonstrations,
        test results, and continuing service, not by the passage of time.
      </p>
    </div>
  );
}
