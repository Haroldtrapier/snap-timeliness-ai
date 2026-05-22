import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Admin (service-role) Supabase client.
 *
 * Bypasses RLS. SERVER-ONLY. Importing this file from any client component
 * will fail to build because of the "server-only" guard above.
 *
 * Use sparingly — only for operations that genuinely need elevated privilege:
 *   - audit_logs writes (so audit can't be tampered with by users)
 *   - system-level provisioning during signup
 *   - background jobs and webhooks
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin env vars not set. Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
