interface Props {
  lifting: { done: number; scheduled: number };
  cardio: { done: number; scheduled: number };
}

export function WeekSummary({ lifting, cardio }: Props) {
  return (
    <section aria-label="This week" className="flex flex-col gap-3 px-1">
      <h2 className="text-meta text-text-tertiary">This week</h2>
      <div className="grid grid-cols-2 gap-6">
        <Stat label="Lifting" {...lifting} />
        <Stat label="Cardio" {...cardio} />
      </div>
    </section>
  );
}

function Stat({ label, done, scheduled }: { label: string; done: number; scheduled: number }) {
  const pct = scheduled > 0 ? Math.min(100, (done / scheduled) * 100) : 0;
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-baseline gap-1.5">
        <span className="text-subheading tabular-nums">
          {done}
          <span className="text-text-tertiary"> / {scheduled}</span>
        </span>
        <span className="text-meta text-text-secondary">{label}</span>
      </p>
      <div className="h-1 overflow-hidden rounded-full bg-surface-subtle" aria-hidden>
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
