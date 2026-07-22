import type {
  EligibilityInput,
  EligibilityEstimate,
  Policy,
  RuleTraceEntry,
} from "./types";
import { getPolicy } from "./policy";

export const ESTIMATE_DISCLAIMER =
  "This is a pre-screening estimate, not a decision. Only your state SNAP agency can determine eligibility or benefit amounts.";

/** Monthly Federal Poverty Guideline (cents) for a household size. */
export function monthlyPovertyCents(policy: Policy, size: number): number {
  const annual =
    policy.povertyAnnualBaseCents + Math.max(0, size - 1) * policy.povertyAnnualPerAdditionalCents;
  return Math.round(annual / 12);
}

/**
 * Monthly income limit (cents) per FNS derivation: annual poverty × factor,
 * divided by 12, rounded UP to the next whole dollar. Matches the published
 * FY2026 Income Eligibility Standards tables exactly (e.g. 48-state size-1
 * net $1,305, gross $1,696).
 */
export function incomeLimitCents(policy: Policy, size: number, factor: number): number {
  const annual =
    policy.povertyAnnualBaseCents + Math.max(0, size - 1) * policy.povertyAnnualPerAdditionalCents;
  return Math.ceil((annual * factor) / 1200) * 100;
}

/** Heating/cooling SUA (cents) for a household size (last bracket repeats). */
export function standardUtilityAllowanceCents(policy: Policy, size: number): number {
  const table = policy.standardUtilityAllowanceCents;
  const idx = Math.min(size, table.length - 1);
  return table[idx] ?? 0;
}

/** Max monthly allotment (cents) for a household size, extending past the table. */
export function maxAllotmentCents(policy: Policy, size: number): number {
  const table = policy.maxAllotmentCents;
  const lastIdx = table.length - 1;
  if (size <= lastIdx) return table[size] ?? 0;
  return table[lastIdx] + (size - lastIdx) * policy.perAdditionalAllotmentCents;
}

/** Standard deduction (cents) for a household size (last bracket repeats). */
export function standardDeductionCents(policy: Policy, size: number): number {
  const table = policy.standardDeductionCents;
  const idx = Math.min(size, table.length - 1);
  return table[idx] ?? 0;
}

/**
 * Compute a SNAP pre-screening estimate (7 CFR 273.9 / 273.10). Pure: no I/O,
 * deterministic, integer-cent arithmetic. Returns an estimate plus a full rule
 * trace for explainability.
 */
export function calculateEligibility(
  input: EligibilityInput,
  policy: Policy = getPolicy(),
): EligibilityEstimate {
  const trace: RuleTraceEntry[] = [];
  const size = Math.max(1, Math.floor(input.householdSize || 1));
  const elderlyDisabled = Boolean(input.hasElderlyOrDisabledMember);

  const earned = Math.max(0, input.earnedIncomeCents || 0);
  const unearned = Math.max(0, input.unearnedIncomeCents || 0);
  const grossIncome = earned + unearned;

  const grossLimit = incomeLimitCents(policy, size, policy.grossIncomeLimitFactor);
  const netLimit = incomeLimitCents(policy, size, policy.netIncomeLimitFactor);

  trace.push({
    step: "income",
    description: "Total gross monthly income",
    detail: { earned, unearned, grossIncome, grossLimit, netLimit },
    result: grossIncome,
  });

  // --- Categorical eligibility (BBCE / receives qualifying benefit) ---
  const bbceLimit =
    policy.bbceGrossLimitFactor != null
      ? Math.round((netLimit * policy.bbceGrossLimitFactor) / policy.netIncomeLimitFactor)
      : null;
  const categoricallyEligible =
    Boolean(input.receivesQualifyingBenefit) ||
    (bbceLimit != null && grossIncome <= bbceLimit);
  trace.push({
    step: "categorical",
    description: "Categorical eligibility (qualifying benefit or state BBCE)",
    detail: {
      receivesQualifyingBenefit: Boolean(input.receivesQualifyingBenefit),
      bbceLimit: bbceLimit ?? -1,
    },
    result: categoricallyEligible,
  });

  // --- Gross income test (waived for elderly/disabled and categorical) ---
  const grossTestApplies = !elderlyDisabled && !categoricallyEligible;
  const grossTestPass = grossTestApplies ? grossIncome <= grossLimit : true;
  trace.push({
    step: "gross_test",
    description: grossTestApplies
      ? "Gross income ≤ 130% of poverty"
      : "Gross income test waived (elderly/disabled or categorical)",
    detail: { applies: grossTestApplies, grossIncome, grossLimit },
    result: grossTestPass,
  });

  // --- Deductions → adjusted income ---
  const earnedDeduction = Math.round(earned * policy.earnedIncomeDeductionRate);
  const standard = standardDeductionCents(policy, size);
  const dependentCare = Math.max(0, input.dependentCareCents || 0);
  const childSupport = Math.max(0, input.childSupportPaidCents || 0);
  const medical =
    elderlyDisabled && (input.medicalExpensesCents || 0) > policy.medicalDeductionThresholdCents
      ? (input.medicalExpensesCents as number) - policy.medicalDeductionThresholdCents
      : 0;

  const adjustedIncome = Math.max(
    0,
    grossIncome - earnedDeduction - standard - dependentCare - childSupport - medical,
  );
  trace.push({
    step: "deductions",
    description: "Adjusted income after earned-income, standard, dependent-care, child-support, medical deductions",
    detail: { earnedDeduction, standard, dependentCare, childSupport, medical, adjustedIncome },
    result: adjustedIncome,
  });

  // --- Excess shelter deduction ---
  const utilities = input.useStandardUtilityAllowance
    ? standardUtilityAllowanceCents(policy, size)
    : Math.max(0, input.utilitiesCents || 0);
  const shelterCost = Math.max(0, input.rentMortgageCents || 0) + utilities;
  const halfAdjusted = Math.round(adjustedIncome / 2);
  let excessShelter = Math.max(0, shelterCost - halfAdjusted);
  const shelterCapped = !elderlyDisabled;
  if (shelterCapped) {
    excessShelter = Math.min(excessShelter, policy.maxExcessShelterDeductionCents);
  }
  const netIncome = Math.max(0, adjustedIncome - excessShelter);
  trace.push({
    step: "shelter",
    description: shelterCapped
      ? "Excess shelter deduction (capped)"
      : "Excess shelter deduction (uncapped — elderly/disabled)",
    detail: { shelterCost, halfAdjusted, excessShelter, netIncome },
    result: netIncome,
  });

  // --- Net income test ---
  const netTestPass = netIncome <= netLimit;
  trace.push({
    step: "net_test",
    description: "Net income ≤ 100% of poverty",
    detail: { netIncome, netLimit },
    result: netTestPass,
  });

  // --- Asset test ---
  const assetTestApplies = !(categoricallyEligible && policy.bbceAssetTestWaived);
  const assetLimit = elderlyDisabled
    ? policy.assetLimitElderlyDisabledCents
    : policy.assetLimitCents;
  const resources = Math.max(0, input.liquidResourcesCents || 0);
  const assetTestPass = assetTestApplies ? resources <= assetLimit : true;
  trace.push({
    step: "asset_test",
    description: assetTestApplies ? "Countable resources ≤ asset limit" : "Asset test waived (BBCE)",
    detail: { applies: assetTestApplies, resources, assetLimit },
    result: assetTestPass,
  });

  const likelyEligible = grossTestPass && netTestPass && assetTestPass;

  // --- Benefit estimate: max allotment − 30% of net income ---
  const maxAllot = maxAllotmentCents(policy, size);
  let benefit = likelyEligible ? Math.max(0, maxAllot - Math.round(netIncome * 0.3)) : 0;
  // Minimum benefit for eligible 1–2 person households.
  if (likelyEligible && size <= 2 && benefit < policy.minBenefitCents) {
    benefit = policy.minBenefitCents;
  }
  trace.push({
    step: "benefit",
    description: "Estimated monthly benefit = max allotment − 30% of net income",
    detail: { maxAllot, thirtyPctNet: Math.round(netIncome * 0.3), benefit },
    result: benefit,
  });

  // --- Expedited service screening (7 CFR 273.2(i)) ---
  const lowIncomeAndResources =
    grossIncome < policy.expeditedGrossIncomeUnderCents &&
    resources <= policy.expeditedResourcesAtMostCents;
  const belowShelter = grossIncome + resources < shelterCost;
  const expedited =
    lowIncomeAndResources || belowShelter || Boolean(input.destituteMigrantWorker);
  trace.push({
    step: "expedited",
    description: "Expedited service screening (7-day processing)",
    detail: { lowIncomeAndResources, belowShelter, destitute: Boolean(input.destituteMigrantWorker) },
    result: expedited,
  });

  return {
    policyVersion: policy.version,
    region: policy.region,
    grossIncomeCents: grossIncome,
    netIncomeCents: netIncome,
    grossTestApplies,
    grossTestPass,
    netTestPass,
    assetTestApplies,
    assetTestPass,
    categoricallyEligible,
    likelyEligible,
    estimatedMonthlyBenefitCents: benefit,
    expedited,
    ruleTrace: trace,
    disclaimer: ESTIMATE_DISCLAIMER,
  };
}
