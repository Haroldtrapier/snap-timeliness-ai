"use client";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Only the public anon key is used here — never
 * import the service role key into anything that ships to the browser.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Supabase env vars not set. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return createBrowserClient(url, anon);
}
