import "server-only";
import { cookies } from "next/headers";

// Dev/test-only clock override so any program day can be exercised (e.g. a Monday on a Sunday).
// Never honoured in production unless ASCENT_ALLOW_TIME_OVERRIDE=1 (used by E2E against a prod build).

export const TIME_OVERRIDE_COOKIE = "ascent-now";

export function timeOverrideAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ASCENT_ALLOW_TIME_OVERRIDE === "1";
}

export async function getTimeOverride(): Promise<Date | null> {
  if (!timeOverrideAllowed()) return null;
  const raw = (await cookies()).get(TIME_OVERRIDE_COOKIE)?.value;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "Now" for program-day logic on the server. */
export async function serverNow(): Promise<Date> {
  return (await getTimeOverride()) ?? new Date();
}
