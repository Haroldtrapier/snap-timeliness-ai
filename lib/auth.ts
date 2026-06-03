import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  SESSION_COOKIE,
  decodeSession,
  nameFromEmail,
  roleFromUserType,
  type Session,
} from "@/lib/session";

export type { Role, Session, UserType } from "@/lib/session";
export {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  encodeSession,
  decodeSession,
  nameFromEmail,
  roleFromUserType,
  userTypeFromRole,
} from "@/lib/session";

// Resolve the current session. With Supabase configured this reads the
// authenticated user and their `profiles` row (existing schema: user_type
// enum), provisioning the profile on first visit since this schema has no
// auth.users trigger. Without Supabase it decodes the demo cookie.
export async function getSession(): Promise<Session | null> {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    let { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, user_type")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      const meta = (user.user_metadata ?? {}) as { user_type?: string; full_name?: string };
      const userType = meta.user_type ?? "applicant";
      const fullName =
        meta.full_name ?? nameFromEmail(user.email ?? "", roleFromUserType(userType));
      await supabase
        .from("profiles")
        .upsert(
          { id: user.id, email: user.email, full_name: fullName, user_type: userType },
          { onConflict: "id" },
        );
      profile = { email: user.email ?? "", full_name: fullName, user_type: userType };
    }

    const role = roleFromUserType(profile.user_type);
    return {
      id: user.id,
      email: profile.email ?? user.email ?? "",
      name: profile.full_name ?? nameFromEmail(user.email ?? "", role),
      role,
    };
  }

  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}
