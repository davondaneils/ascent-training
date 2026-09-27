import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  weeks: number;
  currentWeek: number | null;
  selectedWeek: number;
  deloadWeeks: number[];
}

/** All 12 weeks, current highlighted, deloads marked. Selecting a week changes the day list below. */
export function WeekStrip({ weeks, currentWeek, selectedWeek, deloadWeeks }: Props) {
  return (
    <nav aria-label="Weeks" className="grid grid-cols-6 gap-2">
      {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => {
        const selected = w === selectedWeek;
        const current = w === currentWeek;
        const deload = deloadWeeks.includes(w);
        return (
          <Link
            key={w}
            href={`/plan?week=${w}`}
            scroll={false}
            aria-current={selected ? "page" : undefined}
            aria-label={`Week ${w}${current ? ", current" : ""}${deload ? ", deload" : ""}`}
            className={cn(
              "relative flex h-12 flex-col items-center justify-center rounded-[12px] text-[15px] font-medium tabular-nums transition-colors",
              selected ? "bg-primary text-primary-foreground" : "border border-border-subtle bg-surface text-text-primary",
              current && !selected && "border-accent text-accent ring-1 ring-inset ring-accent",
              current && selected && "bg-accent text-accent-foreground",
            )}
          >
            {w}
            {deload && (
              <span className={cn("text-[10px] font-normal leading-none", selected ? "text-primary-foreground/70" : "text-text-tertiary")}>
                deload
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
