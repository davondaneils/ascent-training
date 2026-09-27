import { NextResponse, type NextRequest } from "next/server";
import { TIME_OVERRIDE_COOKIE, timeOverrideAllowed } from "@/lib/clock";

// /dev/time?at=2026-09-28T09:00:00-04:00  → pretend it's then (dev/test only)
// /dev/time?clear=1                        → back to real time
export function GET(request: NextRequest) {
  if (!timeOverrideAllowed()) return new NextResponse(null, { status: 404 });
  const { searchParams, origin } = request.nextUrl;
  const res = NextResponse.redirect(new URL("/today", origin));
  const at = searchParams.get("at");
  if (searchParams.get("clear") || !at || Number.isNaN(new Date(at).getTime())) {
    res.cookies.delete(TIME_OVERRIDE_COOKIE);
  } else {
    res.cookies.set(TIME_OVERRIDE_COOKIE, new Date(at).toISOString(), { path: "/", sameSite: "lax", httpOnly: true });
  }
  return res;
}
