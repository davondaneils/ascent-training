import { Card, Eyebrow } from "@/components/shared/card";
import { Progress } from "@/components/ui/progress";
import { shortDate } from "@/lib/dates";
import { RELATIVE_LIFTS, STRENGTH_LIFTS, type ProgressData } from "@/lib/data/progress";
import {
  consistency,
  longestSession,
  recentRpe,
  repsSeries,
  repsSummary,
  strengthSeries,
  strengthSummary,
  weeklyAerobicMinutes,
} from "@/lib/training/metrics";
import type { LocalDate, ProgramBlock } from "@/lib/training/types";
import { ChipLinks } from "./chip-links";
import { LineTrend, WeeklyBars } from "./trend-chart";

type Relative = keyof typeof RELATIVE_LIFTS;

export interface ProgressViewProps {
  block: ProgramBlock;
  data: ProgressData;
  startDate: LocalDate;
  today: LocalDate;
  currentWeek: number | null; // null before the start date
  lift: string;
  rel: Relative;
  basePath: string; // "/progress" (gallery reuses the view)
}

const SHORT_NAMES: Record<string, string> = {
  "bench-press": "Bench",
  "paused-bench-press": "Paused bench",
  "leg-press": "Leg press",
  "romanian-deadlift": "RDL",
  "hack-squat": "Hack squat",
};

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center type-body text-text-tertiary">{children}</p>;
}

export function ProgressView({ block, data, startDate, today, currentWeek, lift, rel, basePath }: ProgressViewProps) {
  const name = (slug: string) => block.exercises.find((e) => e.slug === slug)?.name ?? slug;
  const href = (next: { lift?: string; rel?: string }) =>
    `${basePath}${basePath.includes("?") ? "&" : "?"}lift=${next.lift ?? lift}&rel=${next.rel ?? rel}`;

  // Deload sessions are deliberately lighter; they'd read as regressions in a trend.
  const working = data.lifts.filter((h) => !h.isDeload);
  const strength = strengthSeries(working.filter((h) => h.exerciseSlug === lift));
  const strengthLine = strengthSummary(strength);
  const top = strength[strength.length - 1];

  const relSlugs: readonly string[] = RELATIVE_LIFTS[rel];
  const reps = repsSeries(working.filter((h) => relSlugs.includes(h.exerciseSlug)));
  const repsLine = repsSummary(reps);

  const weeks = currentWeek ? weeklyAerobicMinutes(data.cardio, block, startDate, currentWeek) : [];
  const thisWeek = weeks[weeks.length - 1]?.minutes ?? 0;
  const longest = longestSession(data.cardio);
  const rpe = recentRpe(data.cardio, 3);

  const cons = consistency({
    block,
    startDate,
    today,
    completedLiftingDates: data.completedLiftingDates,
    cardioDates: data.cardio.map((c) => c.date),
  });

  const nothingYet = data.lifts.length === 0 && data.cardio.length === 0;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <h1 className="type-title">Progress</h1>
      {nothingYet && (
        <p className="type-body text-text-secondary">Your trends appear here after you complete workouts and cardio.</p>
      )}

      <Card className="flex flex-col gap-4">
        <Eyebrow>Strength</Eyebrow>
        <ChipLinks
          label="Lift"
          selected={lift}
          hrefFor={(v) => href({ lift: v })}
          options={STRENGTH_LIFTS.map((s) => ({ value: s, label: SHORT_NAMES[s] }))}
        />
        {strength.length === 0 ? (
          <Empty>Your {name(lift).toLowerCase()} trend appears after your first session.</Empty>
        ) : (
          <>
            <div className="flex flex-col gap-0.5">
              <p className="type-heading">{strengthLine}</p>
              <p className="type-meta font-normal tabular-nums text-text-secondary">
                Top set {top.topWeight} × {top.topReps} · est. 1RM {Math.round(top.e1rm)} lb
              </p>
              <p className="type-meta font-normal text-text-tertiary">Deload weeks not shown</p>
            </div>
            <LineTrend name="Top set" unit="lb" data={strength.map((p) => ({ label: shortDate(p.date), value: p.topWeight }))} />
          </>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <Eyebrow>Relative strength</Eyebrow>
        <ChipLinks
          label="Movement"
          selected={rel}
          hrefFor={(v) => href({ rel: v })}
          options={[
            { value: "pull-up", label: "Pull-up" },
            { value: "dip", label: "Dip" },
          ]}
        />
        {reps.length === 0 ? (
          <Empty>Your {rel === "dip" ? "dip" : "pull-up"} reps appear after your first session.</Empty>
        ) : (
          <>
            <p className="type-subheading">{repsLine}</p>
            <LineTrend name="Best set" unit="reps" data={reps.map((p) => ({ label: shortDate(p.date), value: p.bestReps }))} />
          </>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <Eyebrow>Cardio</Eyebrow>
        {data.cardio.length === 0 || weeks.length === 0 ? (
          <Empty>Weekly aerobic minutes appear after your first cardio session.</Empty>
        ) : (
          <>
            <div className="flex flex-col gap-0.5">
              <p className="type-heading tabular-nums">{thisWeek} min this week</p>
              <p className="type-meta font-normal text-text-secondary">Easy aerobic minutes per program week</p>
            </div>
            <WeeklyBars
              data={weeks.map((w) => ({ label: `W${w.week}`, minutes: w.minutes, current: w.week === currentWeek, deload: w.isDeload }))}
            />
            <dl className="grid grid-cols-2 gap-4 border-t border-border-subtle pt-4">
              <div>
                <dt className="type-meta text-text-tertiary">Longest session</dt>
                <dd className="type-subheading tabular-nums">
                  {longest?.actualMinutes} min
                  <span className="type-meta font-normal text-text-tertiary"> · {longest && shortDate(longest.date)}</span>
                </dd>
              </div>
              <div>
                <dt className="type-meta text-text-tertiary">Recent RPE</dt>
                <dd className="type-subheading tabular-nums">{rpe.join(" · ")}</dd>
              </div>
            </dl>
          </>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <Eyebrow>Consistency</Eyebrow>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="type-meta text-text-tertiary">Lifting</dt>
            <dd className="type-heading tabular-nums">
              {cons.lifting.done}
              <span className="text-text-tertiary"> / {cons.lifting.scheduled}</span>
            </dd>
          </div>
          <div>
            <dt className="type-meta text-text-tertiary">Cardio</dt>
            <dd className="type-heading tabular-nums">
              {cons.cardio.done}
              <span className="text-text-tertiary"> / {cons.cardio.scheduled}</span>
            </dd>
          </div>
        </dl>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="type-meta text-text-tertiary">Block completion</span>
            <span className="type-meta tabular-nums text-text-secondary">{cons.blockPercent}%</span>
          </div>
          <Progress value={cons.blockPercent} aria-label="Block completion" className="h-1.5" />
        </div>
        <p className="type-meta font-normal text-text-tertiary">Scheduled counts are to date.</p>
      </Card>
    </div>
  );
}
