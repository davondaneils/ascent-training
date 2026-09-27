import { Check } from "lucide-react";
import Link from "next/link";
import { Card, Eyebrow } from "@/components/shared/card";
import { Button } from "@/components/ui/button";
import type { CardioLogSummary } from "@/lib/data/today";
import { formatMinutes } from "@/lib/training/format";
import type { CardioPrescription } from "@/lib/training/types";

const MODALITY: Record<CardioPrescription["modality"], string> = { bike: "Bike", incline_walk: "Incline walk" };

interface Props {
  cardio: CardioPrescription;
  date: string;
  /** Primary card (Saturday) vs. "Later today" after lifting. */
  primary: boolean;
  logs: CardioLogSummary[];
}

export function CardioCard({ cardio, date, primary, logs }: Props) {
  const done = logs[0];
  const target = formatMinutes(cardio.targetMinutes, cardio.targetMinutesMax);
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Eyebrow>{primary ? "Long easy aerobic" : "Later today"}</Eyebrow>
        <h2 className={primary ? "type-heading" : "type-subheading"}>
          {MODALITY[cardio.modality]} · {target}
        </h2>
        <p className="type-body text-text-secondary">
          Easy · RPE {cardio.targetRpeMin}–{cardio.targetRpeMax}
        </p>
      </div>
      {done ? (
        <p className="flex items-center gap-2 text-[15px] font-medium text-success">
          <Check className="size-5" aria-hidden /> Done · {done.actualMinutes} min · RPE {done.rpe}
        </p>
      ) : (
        <Button asChild size={primary ? "xl" : "touch"} variant={primary ? "default" : "secondary"} className={primary ? "" : "w-full"}>
          <Link href={`/cardio/${date}`}>Start Cardio</Link>
        </Button>
      )}
    </Card>
  );
}
