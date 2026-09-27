interface Props {
  lifting: { done: number; scheduled: number };
  cardio: { done: number; scheduled: number };
}

export function WeekSummary({ lifting, cardio }: Props) {
  return (
    <section aria-label="This week" className="flex flex-col gap-2 px-1">
      <h2 className="text-[13px] font-medium text-text-tertiary">This week</h2>
      <div className="flex gap-8">
        <Stat label="lifting" {...lifting} />
        <Stat label="cardio" {...cardio} />
      </div>
    </section>
  );
}

function Stat({ label, done, scheduled }: { label: string; done: number; scheduled: number }) {
  return (
    <p className="text-[15px] text-text-secondary">
      <span className="text-lg font-semibold tabular-nums text-text-primary">
        {done} / {scheduled}
      </span>{" "}
      {label}
    </p>
  );
}
