import type { Policy, Region } from "./types";

// ============================================================================
// SNAP policy figures — FY2026 (effective Oct 1, 2025 – Sep 30, 2026).
//
// VERIFIED 2026-07-22 against official sources:
//   • FNS FY2026 Maximum Allotments & Deductions
//     (fns-prod.azureedge.us/.../snap-fy26maximumAllotments-deductions.pdf)
//   • FNS FY2026 Income Eligibility Standards
//     (fns-prod.azureedge.us/.../snap-fy26-incomeEligibilityStandards.pdf)
//   • FNS FY2026 COLA memo (usda.gov/.../fns.snap-cola-fy26memo.pdf)
//   • NC DSS-8560 Caseworker Desk Reference (BBCE 200% FPL, $744 shelter cap)
//
// Re-verify every Oct 1 (federal fiscal year COLA).
// Notes:
//   • Income limits are DERIVED in the engine as ceil(annual FPL × factor / 12)
//     which reproduces the published FNS tables exactly.
//   • Alaska has urban/rural1/rural2 allotment tiers; the single "urban" tier
//     is modeled here. NC (contiguous) is the launch market.
//   • NC SUA varies by household size (heating/cooling standard); values are
//     from snapscreener.com's NC guide — confirm against the county DSS desk
//     reference before a production determination-adjacent use.
// ============================================================================

const D = (dollars: number) => Math.round(dollars * 100); // dollars → cents

// 2025 HHS Federal Poverty Guidelines (basis for FY2026 SNAP limits).
// Verified: derived monthly limits match the FNS FY2026 tables for all sizes.
const FPL_2025 = {
  contiguous: { base: 15650, perAdd: 5500 },
  alaska: { base: 19550, perAdd: 6875 },
  hawaii: { base: 17990, perAdd: 6325 },
} as const;

// Max monthly allotment by household size (index 0 unused; 1..8). FNS FY2026.
const MAX_ALLOTMENT = {
  contiguous: [0, 298, 546, 785, 994, 1183, 1421, 1571, 1789],
  alaska: [0, 385, 707, 1015, 1285, 1529, 1838, 2031, 2314], // urban tier
  hawaii: [0, 506, 929, 1334, 1689, 2010, 2415, 2668, 3040],
} as const;
const PER_ADDITIONAL = { contiguous: 218, alaska: 282, hawaii: 371 } as const;

// Standard deduction by size (last bracket repeats for larger households).
const STD_DEDUCTION = {
  contiguous: [0, 209, 209, 209, 223, 261, 299],
  alaska: [0, 358, 358, 358, 358, 358, 374],
  hawaii: [0, 295, 295, 295, 300, 344, 344],
} as const;

// NC heating/cooling Standard Utility Allowance by household size (1..5+).
const NC_SUA = [0, 637, 699, 768, 837, 912];

export const POLICIES: Record<Region, Policy> = {
  contiguous: {
    version: "FY2026-contiguous.v2-verified",
    fiscalYear: 2026,
    region: "contiguous",
    povertyAnnualBaseCents: D(FPL_2025.contiguous.base),
    povertyAnnualPerAdditionalCents: D(FPL_2025.contiguous.perAdd),
    grossIncomeLimitFactor: 1.3,
    netIncomeLimitFactor: 1.0,
    // North Carolina BBCE: 200% FPL gross limit, asset test waived
    // (NC DSS-8560: size-1 limit $2,610 = 2 × $1,305 net limit).
    bbceGrossLimitFactor: 2.0,
    bbceAssetTestWaived: true,
    earnedIncomeDeductionRate: 0.2,
    standardDeductionCents: STD_DEDUCTION.contiguous.map(D),
    medicalDeductionThresholdCents: D(35),
    maxExcessShelterDeductionCents: D(744),
    standardUtilityAllowanceCents: NC_SUA.map(D),
    maxAllotmentCents: MAX_ALLOTMENT.contiguous.map(D),
    perAdditionalAllotmentCents: D(PER_ADDITIONAL.contiguous),
    minBenefitCents: D(24),
    assetLimitCents: D(3000),
    assetLimitElderlyDisabledCents: D(4500),
    expeditedGrossIncomeUnderCents: D(150),
    expeditedResourcesAtMostCents: D(100),
  },

  alaska: {
    version: "FY2026-alaska.v2-verified",
    fiscalYear: 2026,
    region: "alaska",
    povertyAnnualBaseCents: D(FPL_2025.alaska.base),
    povertyAnnualPerAdditionalCents: D(FPL_2025.alaska.perAdd),
    grossIncomeLimitFactor: 1.3,
    netIncomeLimitFactor: 1.0,
    bbceGrossLimitFactor: null,
    bbceAssetTestWaived: false,
    earnedIncomeDeductionRate: 0.2,
    standardDeductionCents: STD_DEDUCTION.alaska.map(D),
    medicalDeductionThresholdCents: D(35),
    maxExcessShelterDeductionCents: D(1189),
    standardUtilityAllowanceCents: [0].map(D), // set per state before use
    maxAllotmentCents: MAX_ALLOTMENT.alaska.map(D),
    perAdditionalAllotmentCents: D(PER_ADDITIONAL.alaska),
    minBenefitCents: D(31), // urban tier
    assetLimitCents: D(3000),
    assetLimitElderlyDisabledCents: D(4500),
    expeditedGrossIncomeUnderCents: D(150),
    expeditedResourcesAtMostCents: D(100),
  },

  hawaii: {
    version: "FY2026-hawaii.v2-verified",
    fiscalYear: 2026,
    region: "hawaii",
    povertyAnnualBaseCents: D(FPL_2025.hawaii.base),
    povertyAnnualPerAdditionalCents: D(FPL_2025.hawaii.perAdd),
    grossIncomeLimitFactor: 1.3,
    netIncomeLimitFactor: 1.0,
    bbceGrossLimitFactor: null,
    bbceAssetTestWaived: false,
    earnedIncomeDeductionRate: 0.2,
    standardDeductionCents: STD_DEDUCTION.hawaii.map(D),
    medicalDeductionThresholdCents: D(35),
    maxExcessShelterDeductionCents: D(1003),
    standardUtilityAllowanceCents: [0].map(D), // set per state before use
    maxAllotmentCents: MAX_ALLOTMENT.hawaii.map(D),
    perAdditionalAllotmentCents: D(PER_ADDITIONAL.hawaii),
    minBenefitCents: D(41),
    assetLimitCents: D(3000),
    assetLimitElderlyDisabledCents: D(4500),
    expeditedGrossIncomeUnderCents: D(150),
    expeditedResourcesAtMostCents: D(100),
  },
};

export function getPolicy(region: Region = "contiguous"): Policy {
  return POLICIES[region];
}
