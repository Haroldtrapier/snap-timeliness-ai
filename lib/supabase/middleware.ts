import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request and enforces auth
 * gating for /(app)/* and /org/* routes.
 *
 * Unauthenticated users hitting protected routes are redirected to /login.
 * Authenticated users hitting /login or /signup are sent to their dashboard.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    // Without Supabase env, fall through. Routes will display their own
    // configuration-error notices instead of crashing the whole app.
    return response;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const isAppRoute = isProtectedAppRoute(path);
  const isOrgRoute = path.startsWith("/org");
  const isAuthRoute = path === "/login" || path === "/signup" || path === "/onboarding";

  if (!user && (isAppRoute || isOrgRoute || path === "/onboarding")) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  if (user && (path === "/login" || path === "/signup")) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/dashboard";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}

const APP_PREFIXES = [
  "/dashboard",
  "/eligibility-check",
  "/application-checklist",
  "/documents",
  "/notices",
  "/deadlines",
  "/benefit-planner",
  "/grocery-plan",
  "/assistant",
  "/settings",
];

function isProtectedAppRoute(path: string): boolean {
  return APP_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}
