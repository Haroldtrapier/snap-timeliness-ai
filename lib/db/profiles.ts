import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, UserType } from "./types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile | null) ?? null;
}

export async function upsertProfile(
  userId: string,
  patch: Partial<Profile> & { email?: string | null }
): Promise<Profile> {
  // Admin client used so signup can provision a profile even if the trigger
  // hasn't created one yet. Within sign-in sessions, this is also fine — the
  // service role bypasses RLS but the userId is fixed by the caller.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email: patch.email ?? null,
        full_name: patch.full_name ?? null,
        user_type: (patch.user_type as UserType) ?? "applicant",
        state: patch.state ?? null,
        county: patch.county ?? null,
        language: patch.language ?? "en",
        accessibility: patch.accessibility ?? [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Profile;
}

export async function updateOwnProfile(patch: Partial<Profile>): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: patch.full_name,
      state: patch.state,
      county: patch.county,
      language: patch.language,
      accessibility: patch.accessibility,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Profile;
}
