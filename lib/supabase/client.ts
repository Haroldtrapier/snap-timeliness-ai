import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Supabase env vars not set.");
  }
  return createBrowserClient(url, anon);
}

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";
