import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  SESSION_COOKIE,
  decodeSession,
  nameFromEmail,
  type Role,
  type Session,
} from "@/lib/session";

export type { Role, Session } from "@/lib/session";
export {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  encodeSession,
  decodeSession,
  nameFromEmail,
} from "@/lib/session";

// Resolve the current session. With Supabase configured this reads the
// authenticated user and their profile; otherwise it decodes the demo cookie.
export async function getSession(): Promise<Session | null> {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, role")
      .eq("id", user.id)
      .single();

    const role: Role = profile?.role === "agency" ? "agency" : "applicant";
    return {
      email: profile?.email ?? user.email ?? "",
      name: profile?.full_name ?? nameFromEmail(user.email ?? "", role),
      role,
    };
  }

  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}
