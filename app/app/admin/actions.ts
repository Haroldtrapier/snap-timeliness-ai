"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSupabaseConfigured || session.userType !== "admin") redirect("/app");
  return session;
}

export async function createCountyOrg(formData: FormData) {
  await requireAdmin();
  const state = String(formData.get("state") ?? "").trim();
  const county = String(formData.get("county") ?? "").trim();
  if (!state || !county) redirect("/app/admin?error=org");

  const supabase = await createSupabaseServerClient();
  await supabase.rpc("find_or_create_county_org", { p_state: state, p_county: county });

  revalidatePath("/app/admin");
  redirect("/app/admin?ok=org");
}

export async function grantMembership(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const orgId = String(formData.get("org_id") ?? "");
  const role = String(formData.get("role") ?? "worker");
  if (!userId || !orgId) redirect("/app/admin?error=grant");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("grant_org_membership", {
    p_user: userId,
    p_org: orgId,
    p_role: role,
  });
  if (error) redirect("/app/admin?error=grant");

  revalidatePath("/app/admin");
  redirect("/app/admin?ok=grant");
}

export async function revokeMembership(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const orgId = String(formData.get("org_id") ?? "");
  if (!userId || !orgId) redirect("/app/admin");

  const supabase = await createSupabaseServerClient();
  await supabase.rpc("revoke_org_membership", { p_user: userId, p_org: orgId });

  revalidatePath("/app/admin");
  redirect("/app/admin?ok=revoke");
}
