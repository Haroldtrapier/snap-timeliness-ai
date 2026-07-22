// SNAP eligibility pre-screening — types.
//
// IMPORTANT: this engine produces a pre-screening ESTIMATE, never an official
// determination. Final eligibility is decided only by the state SNAP agency.
// All monetary values are integer CENTS to avoid floating-point drift.

export type Region = "contiguous" | "alaska" | "hawaii";

export interface EligibilityInput {
  householdSize: number;
  /** Any member aged 60+ or receiving disability benefits. Changes which tests
   *  apply (no gross-income test) and uncaps the shelter deduction. */
  hasElderlyOrDisabledMember: boolean;

  // Monthly income (cents).
  earnedIncomeCents: number; // wages / self-employment
  unearnedIncomeCents: number; // benefits, child support received, etc.

  // Monthly deductible expenses (cents).
  dependentCareCents?: number;
  /** Total monthly medical expenses for elderly/disabled members; only the
   *  amount over the policy threshold is deductible. */
  medicalExpensesCents?: number;
  childSupportPaidCents?: number;
  rentMortgageCents?: number;
  /** Actual monthly utility cost; ignored when useStandardUtilityAllowance. */
  utilitiesCents?: number;
  useStandardUtilityAllowance?: boolean;

  // Assets (cents).
  liquidResourcesCents?: number;

  // Categorical eligibility.
  /** Receives TANF/SSI or other qualifying benefit → categorically eligible. */
  receivesQualifyingBenefit?: boolean;

  /** Destitute migrant/seasonal farmworker → expedited regardless of the
   *  income/resource thresholds. */
  destituteMigrantWorker?: boolean;
}

export interface RuleTraceEntry {
  step: string;
  description: string;
  /** Machine-readable inputs/thresholds for this step (cents unless noted). */
  detail: Record<string, number | boolean | string>;
  result: boolean | number | string;
}

export interface EligibilityEstimate {
  policyVersion: string;
  region: Region;

  grossIncomeCents: number;
  netIncomeCents: number;

  grossTestApplies: boolean;
  grossTestPass: boolean;
  netTestPass: boolean;
  assetTestApplies: boolean;
  assetTestPass: boolean;

  categoricallyEligible: boolean;
  /** The pre-screen headline: passes the applicable income (and asset) tests. */
  likelyEligible: boolean;

  estimatedMonthlyBenefitCents: number;
  expedited: boolean;

  ruleTrace: RuleTraceEntry[];
  disclaimer: string;
}

/** SNAP policy figures for one fiscal year + region. All cents unless noted. */
export interface Policy {
  version: string; // e.g. "FY2026-contiguous"
  fiscalYear: number;
  region: Region;

  // Federal Poverty Guideline, annual, for the region (SNAP income tests derive
  // from this): monthly poverty for size n = round((base + (n-1)*perAdd) / 12).
  povertyAnnualBaseCents: number;
  povertyAnnualPerAdditionalCents: number;

  grossIncomeLimitFactor: number; // 1.30 (statutory)
  netIncomeLimitFactor: number; // 1.00 (statutory)
  /** BBCE gross-income factor for categorical eligibility (e.g. 2.00 = 200% FPL),
   *  or null if the state has no BBCE. */
  bbceGrossLimitFactor: number | null;
  /** Whether BBCE waives the asset test in this state. */
  bbceAssetTestWaived: boolean;

  earnedIncomeDeductionRate: number; // 0.20 (statutory)
  /** Standard deduction by household size (index 1..N; sizes past the last
   *  entry reuse the last, per the 6+ bracket). */
  standardDeductionCents: number[];
  medicalDeductionThresholdCents: number; // $35 → 3500
  maxExcessShelterDeductionCents: number;
  /** State heating/cooling Standard Utility Allowance by household size
   *  (index 1..N; sizes past the last entry reuse the last). Some states
   *  (e.g. NC) vary the SUA by household size. */
  standardUtilityAllowanceCents: number[];

  /** Max monthly allotment by household size (index 1..8). */
  maxAllotmentCents: number[];
  perAdditionalAllotmentCents: number; // added per person beyond the table
  minBenefitCents: number; // 1–2 person households

  // Asset limits when the asset test applies (not waived by BBCE).
  assetLimitCents: number;
  assetLimitElderlyDisabledCents: number;

  // Expedited-service thresholds (7 CFR 273.2(i)).
  expeditedGrossIncomeUnderCents: number; // < $150 → 15000
  expeditedResourcesAtMostCents: number; // ≤ $100 → 10000
}
