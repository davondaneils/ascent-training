import Link from "next/link";
import type { CampaignPosition } from "@/lib/campaign/schedule";

export function CampaignBrief({ position, restful = false }: { position: CampaignPosition; restful?: boolean }) {
  if (position.status === "before_start") return null;
  return (
    <section aria-label="Five-year campaign" className="flex flex-col gap-2 rounded-[20px] border border-border-subtle bg-surface px-4 py-4">
      <p className="type-meta text-text-tertiary">FIVE YEARS TO PREPARE · YEAR {position.year} OF 5</p>
      <h2 className="type-subheading">{position.status === "complete" ? "Campaign review" : position.cycle.title}</h2>
      {restful ? (
        <p className="type-body text-text-secondary">Worship, family, mercy, and recovery. Preparation is not the purpose of Sunday.</p>
      ) : (
        <>
          <p className="type-body text-text-secondary">
            Cycle {position.cycleNumber} of 20 · Week {position.weekInCycle} of 13 · {position.stage}
          </p>
          <p className="text-[14px] leading-relaxed text-text-secondary">
            If religious persecution or civil disorder reached your community, could you protect life, stay faithful, and help others? This cycle rehearses: {position.cycle.scenario}
          </p>
        </>
      )}
      <Link href="/campaign" className="w-fit text-[14px] font-medium text-accent underline-offset-4 hover:underline">
        View the five-year roadmap →
      </Link>
    </section>
  );
}
