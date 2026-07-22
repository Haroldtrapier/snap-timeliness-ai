// Pre-screening data access: financial profile (engine inputs) + estimate
// snapshots. The calculation itself is pure (lib/eligibility); this module
// only loads inputs, runs the engine, and persists the result with its full
// rule trace + policy version.

import { calculateEligibility, getPolicy } from "@/lib/eligibility";
import type { EligibilityEstimate, EligibilityInput } from "@/lib/eligibility";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getApplicantClientId } from "@/lib/repositories";

export interface FinancialProfile {
  hasElderlyOrDisabledMember: boolean;
  earnedIncomeCents: number;
  unearnedIncomeCents: number;
  dependentCareCents: number;
  medicalExpensesCents: number;
  childSupportPaidCents: number;
  rentMortgageCents: number;
  utilitiesCents: number;
  useStandardUtilityAllowance: boolean;
  liquidResourcesCents: number;
  receivesQualifyingBenefit: boolean;
}

export const EMPTY_PROFILE: FinancialProfile = {
  hasElderlyOrDisabledMember: false,
  earnedIncomeCents: 0,
  unearnedIncomeCents: 0,
  dependentCareCents: 0,
  medicalExpensesCents: 0,
  childSupportPaidCents: 0,
  rentMortgageCents: 0,
  utilitiesCents: 0,
  useStandardUtilityAllowance: true,
  liquidResourcesCents: 0,
  receivesQualifyingBenefit: false,
};

export interface SavedEstimate extends EligibilityEstimate {
  computedAt: string;
  householdSize: number;
}

/** Load the applicant's saved financial profile (or null if none yet). */
export async function getFinancialProfile(userId?: string): Promise<FinancialProfile | null> {
  if (!isSupabaseConfigured || !userId || userId === "demo") return null;
  const clientId = await getApplicantClientId(userId);
  if (!clientId) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("financial_profiles")
    .select(
      "has_elderly_or_disabled_member, earned_income_cents, unearned_income_cents, dependent_care_cents, medical_expenses_cents, child_support_paid_cents, rent_mortgage_cents, utilities_cents, use_standard_utility_allowance, liquid_resources_cents, receives_qualifying_benefit",
    )
    .eq("client_id", clientId)
    .maybeSingle();
  if (!data) return null;

  return {
    hasElderlyOrDisabledMember: data.has_elderly_or_disabled_member,
    earnedIncomeCents: data.earned_income_cents,
    unearnedIncomeCents: data.unearned_income_cents,
    dependentCareCents: data.dependent_care_cents,
    medicalExpensesCents: data.medical_expenses_cents,
    childSupportPaidCents: data.child_support_paid_cents,
    rentMortgageCents: data.rent_mortgage_cents,
    utilitiesCents: data.utilities_cents,
    useStandardUtilityAllowance: data.use_standard_utility_allowance,
    liquidResourcesCents: data.liquid_resources_cents,
    receivesQualifyingBenefit: data.receives_qualifying_benefit,
  };
}

/** Latest saved estimate for the applicant (or null). */
export async function getLatestEstimate(userId?: string): Promise<SavedEstimate | null> {
  if (!isSupabaseConfigured || !userId || userId === "demo") return null;
  const clientId = await getApplicantClientId(userId);
  if (!clientId) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: row }, { data: snapCase }] = await Promise.all([
    supabase
      .from("eligibility_estimates")
      .select(
        "computed_at, policy_version, gross_income_cents, net_income_cents, gross_test_pass, net_test_pass, asset_test_pass, categorically_eligible, likely_eligible, estimated_monthly_benefit_cents, expedited, rule_trace, disclaimer",
      )
      .eq("client_id", clientId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("snap_cases")
      .select("household_size")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!row) return null;

  return {
    computedAt: row.computed_at,
    householdSize: snapCase?.household_size ?? 1,
    policyVersion: row.policy_version,
    region: "contiguous",
    grossIncomeCents: row.gross_income_cents,
    netIncomeCents: row.net_income_cents,
    grossTestApplies: true,
    grossTestPass: row.gross_test_pass,
    netTestPass: row.net_test_pass,
    assetTestApplies: true,
    assetTestPass: row.asset_test_pass,
    categoricallyEligible: row.categorically_eligible,
    likelyEligible: row.likely_eligible,
    estimatedMonthlyBenefitCents: row.estimated_monthly_benefit_cents,
    expedited: row.expedited,
    ruleTrace: (row.rule_trace ?? []) as SavedEstimate["ruleTrace"],
    disclaimer: row.disclaimer,
  };
}

/**
 * Upsert the financial profile, run the engine against the client's household
 * size, and persist an estimate snapshot. Returns the fresh estimate.
 */
export async function saveProfileAndCompute(
  userId: string,
  profile: FinancialProfile,
): Promise<EligibilityEstimate | null> {
  if (!isSupabaseConfigured || userId === "demo") return null;
  const clientId = await getApplicantClientId(userId);
  if (!clientId) return null;

  const supabase = await createSupabaseServerClient();

  const { error: profErr } = await supabase.from("financial_profiles").upsert(
    {
      client_id: clientId,
      has_elderly_or_disabled_member: profile.hasElderlyOrDisabledMember,
      earned_income_cents: profile.earnedIncomeCents,
      unearned_income_cents: profile.unearnedIncomeCents,
      dependent_care_cents: profile.dependentCareCents,
      medical_expenses_cents: profile.medicalExpensesCents,
      child_support_paid_cents: profile.childSupportPaidCents,
      rent_mortgage_cents: profile.rentMortgageCents,
      utilities_cents: profile.utilitiesCents,
      use_standard_utility_allowance: profile.useStandardUtilityAllowance,
      liquid_resources_cents: profile.liquidResourcesCents,
      receives_qualifying_benefit: profile.receivesQualifyingBenefit,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "client_id" },
  );
  if (profErr) return null;

  const { data: snapCase } = await supabase
    .from("snap_cases")
    .select("id, household_size")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const input: EligibilityInput = {
    householdSize: snapCase?.household_size ?? 1,
    hasElderlyOrDisabledMember: profile.hasElderlyOrDisabledMember,
    earnedIncomeCents: profile.earnedIncomeCents,
    unearnedIncomeCents: profile.unearnedIncomeCents,
    dependentCareCents: profile.dependentCareCents,
    medicalExpensesCents: profile.medicalExpensesCents,
    childSupportPaidCents: profile.childSupportPaidCents,
    rentMortgageCents: profile.rentMortgageCents,
    utilitiesCents: profile.utilitiesCents,
    useStandardUtilityAllowance: profile.useStandardUtilityAllowance,
    liquidResourcesCents: profile.liquidResourcesCents,
    receivesQualifyingBenefit: profile.receivesQualifyingBenefit,
  };
  const estimate = calculateEligibility(input, getPolicy("contiguous"));

  await supabase.from("eligibility_estimates").insert({
    client_id: clientId,
    case_id: snapCase?.id ?? null,
    policy_version: estimate.policyVersion,
    gross_income_cents: estimate.grossIncomeCents,
    net_income_cents: estimate.netIncomeCents,
    gross_test_pass: estimate.grossTestPass,
    net_test_pass: estimate.netTestPass,
    asset_test_pass: estimate.assetTestPass,
    categorically_eligible: estimate.categoricallyEligible,
    likely_eligible: estimate.likelyEligible,
    estimated_monthly_benefit_cents: estimate.estimatedMonthlyBenefitCents,
    expedited: estimate.expedited,
    rule_trace: estimate.ruleTrace,
    disclaimer: estimate.disclaimer,
  });

  return estimate;
}
