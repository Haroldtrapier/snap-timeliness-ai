"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Starter document checklist seeded for a new applicant. Statuses default
// to 'open' (nothing provided yet) which yields a 0% readiness to begin with.
const STARTER_ITEMS: { label: string; category: string; required: boolean }[] = [
  { label: "Photo ID (driver's license or state ID)", category: "Identity", required: true },
  { label: "Social Security cards for everyone applying", category: "Identity", required: true },
  { label: "Proof of address (lease or utility bill)", category: "Residency", required: true },
  { label: "Pay stubs — last 30 days", category: "Income", required: true },
  { label: "Proof of other income (if any)", category: "Income", required: false },
  { label: "Childcare or dependent-care costs", category: "Expenses", required: false },
  { label: "Utility bill (heating/cooling)", category: "Expenses", required: false },
  { label: "Rent or mortgage statement", category: "Housing", required: false },
];

export async function completeOnboarding(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  // Demo mode has no backend to write to.
  if (!isSupabaseConfigured || session.id === "demo") redirect("/app/applicant");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim() || null;
  const county = String(formData.get("county") ?? "").trim() || null;
  const language = String(formData.get("language") ?? "en").trim() || "en";
  const householdSize = Number.parseInt(String(formData.get("household_size") ?? ""), 10);
  const incomeDollars = Number.parseFloat(String(formData.get("monthly_income") ?? ""));

  if (!fullName) redirect("/app/onboarding?error=name");

  const supabase = await createSupabaseServerClient();

  // Don't double-provision.
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("owner_user_id", session.id)
    .limit(1)
    .maybeSingle();
  if (existing) redirect("/app/applicant");

  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .insert({ owner_user_id: session.id, full_name: fullName, state, county, language })
    .select("id")
    .single();
  if (clientErr || !client) redirect("/app/onboarding?error=save");

  // Auto-link the client to its county DSS organization so the right
  // caseworkers (org members) can see it. Applicants still own their data.
  if (state && county) {
    const { data: orgId } = await supabase.rpc("find_or_create_county_org", {
      p_state: state,
      p_county: county,
    });
    if (orgId) {
      await supabase.from("clients").update({ organization_id: orgId }).eq("id", client.id);
    }
  }

  const { data: snapCase, error: caseErr } = await supabase
    .from("snap_cases")
    .insert({
      client_id: client.id,
      stage: "applying",
      household_size: Number.isFinite(householdSize) ? householdSize : null,
      monthly_income_cents: Number.isFinite(incomeDollars) ? Math.round(incomeDollars * 100) : null,
      filed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (caseErr || !snapCase) redirect("/app/applicant");

  const { data: checklist } = await supabase
    .from("application_checklists")
    .insert({ case_id: snapCase.id })
    .select("id")
    .single();

  if (checklist) {
    await supabase
      .from("checklist_items")
      .insert(STARTER_ITEMS.map((it) => ({ checklist_id: checklist.id, ...it })));
  }

  redirect("/app/applicant");
}
