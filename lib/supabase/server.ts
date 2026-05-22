import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client bound to the current request cookies.
 * Uses the anon key + the user's auth cookie, so RLS is enforced.
 *
 * For privileged operations that must bypass RLS (audit logs, signup
 * provisioning), use createAdminClient from "./admin".
 */
export function createClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Supabase env vars not set. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a Server Component — cookies are immutable there.
          // The middleware refresh path handles session cookie writes.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {}
      },
    },
  });
}

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
