import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

// Service-role client for trusted server-side jobs (e.g. the reminders cron)
// that must read/write across users without an authenticated session. NEVER
// expose the service-role key to the browser — it is server-only (not
// NEXT_PUBLIC) and bypasses RLS.
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isServiceConfigured = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

export function createSupabaseServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
