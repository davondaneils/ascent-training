import { getTimeOverride } from "@/lib/clock";

/** Visible whenever the dev clock override is active, so a fake date is never mistaken for real. */
export async function DevTimeBanner() {
  const at = await getTimeOverride();
  if (!at) return null;
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
  return (
    <div className="bg-warning/15 px-4 py-1.5 text-center text-[12px] text-text-primary">
      Dev clock: {label} · <a href="/dev/time?clear=1" className="underline">use real time</a>
    </div>
  );
}
