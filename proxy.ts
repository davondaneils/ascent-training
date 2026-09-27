import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except Next internals, the PWA manifest/service worker, and static assets.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|exercise-media/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
