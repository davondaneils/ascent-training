import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "./env";

const PUBLIC_PATHS = ["/login", "/auth/"];

function isPublic(pathname: string): boolean {
  // Dev-only visual QA gallery renders fixtures, never user data.
  if (process.env.NODE_ENV !== "production" && pathname.startsWith("/dev/gallery")) return true;
  return PUBLIC_PATHS.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p));
}

/** Refreshes the Supabase session on every request and gates app routes behind sign-in. */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // A sign-in link that landed somewhere other than /auth/confirm (e.g. Supabase fell back to the
  // Site URL root): forward its code/token there instead of silently dropping it.
  const { searchParams: sp, pathname: path } = request.nextUrl;
  if (path !== "/auth/confirm" && (sp.has("code") || (sp.has("token_hash") && sp.has("type")))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/confirm";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // Validates the JWT (and refreshes it if needed). Nothing may run between client creation and this.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname } = request.nextUrl;

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const r = NextResponse.redirect(url);
    for (const c of response.cookies.getAll()) r.cookies.set(c);
    return r;
  };

  if (!signedIn && !isPublic(pathname)) return redirectTo("/login");
  if (signedIn && pathname === "/login") return redirectTo("/today");
  return response;
}
