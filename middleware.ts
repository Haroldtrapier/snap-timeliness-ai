import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";

// Gate the authenticated product area (/app/*). With Supabase configured we
// refresh the real session and check the user; otherwise we check the demo
// cookie. Unauthenticated requests are redirected to /login?next=…
export async function middleware(req: NextRequest) {
  const toLogin = () => {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  };

  if (isSupabaseConfigured) {
    const { response, user } = await updateSession(req);
    return user ? response : toLogin();
  }

  const hasDemoSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  return hasDemoSession ? NextResponse.next() : toLogin();
}

export const config = {
  matcher: ["/app/:path*"],
};
