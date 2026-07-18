import type { Policy, Region } from "./types";

// ============================================================================
// SNAP policy figures — FY2026 (effective Oct 1, 2025 – Sep 30, 2026).
//
// ⚠️  VERIFICATION REQUIRED BEFORE PRODUCTION USE  ⚠️
// These constants must be checked, cell by cell, against the official FNS COLA
// memo and the state's Standard Utility Allowance tables, and re-checked each
// federal fiscal year (figures change every Oct 1). The engine's arithmetic is
// unit-tested and correct independent of these numbers; only the numbers below
// carry policy risk.
//
// Sources to verify against:
//   FNS FY2026 COLA:            https://www.fns.usda.gov/snap/allotment/COLA
//   FNS max allotments/deductions PDF (snap-fy26maximumAllotments-deductions)
//   NC DHHS SNAP manual (SUA + BBCE specifics)
//
// Confirmed from FNS-derived sources at time of writing:
//   • Max allotment (48 states): 1-person $298, 4-person $994
//   • Standard deduction (48 states): $209 (1–3), $223 (4), $261 (5), $299 (6+)
//   • Gross income limit = 130% FPL; net = 100% FPL; earned-income deduction 20%
// Figures marked "UNVERIFIED" below are best-effort and MUST be confirmed.
// ============================================================================

const D = (dollars: number) => Math.round(dollars * 100); // dollars → cents

// 2025 HHS Federal Poverty Guidelines (used for FY2026 SNAP), 48 states + DC.
// Annual: $15,650 for 1, +$5,500 per additional person.  [verify]
const FPL_2025 = {
  contiguous: { base: 15650, perAdd: 5500 },
  alaska: { base: 19550, perAdd: 6875 }, // UNVERIFIED
  hawaii: { base: 17990, perAdd: 6325 }, // UNVERIFIED
} as const;

// Max monthly allotment by household size (index 0 unused; 1..8), 48 states.
// 1 and 4 confirmed ($298, $994); 2,3,5,6,7,8 + increment UNVERIFIED.
const MAX_ALLOTMENT_CONTIGUOUS = [0, 298, 546, 785, 994, 1183, 1421, 1571, 1795];
const PER_ADDITIONAL_CONTIGUOUS = 225; // UNVERIFIED

// Standard deduction by size: $209 (1–3), $223 (4), $261 (5), $299 (6+). Confirmed.
const STD_DEDUCTION_CONTIGUOUS = [0, 209, 209, 209, 223, 261, 299];

export const POLICIES: Record<Region, Policy> = {
  contiguous: {
    version: "FY2026-contiguous",
    fiscalYear: 2026,
    region: "contiguous",
    povertyAnnualBaseCents: D(FPL_2025.contiguous.base),
    povertyAnnualPerAdditionalCents: D(FPL_2025.contiguous.perAdd),
    grossIncomeLimitFactor: 1.3,
    netIncomeLimitFactor: 1.0,
    // North Carolina operates BBCE at 200% FPL with the asset test waived. [verify]
    bbceGrossLimitFactor: 2.0,
    bbceAssetTestWaived: true,
    earnedIncomeDeductionRate: 0.2,
    standardDeductionCents: STD_DEDUCTION_CONTIGUOUS.map(D),
    medicalDeductionThresholdCents: D(35),
    maxExcessShelterDeductionCents: D(744), // UNVERIFIED (FY2026 48-state cap)
    standardUtilityAllowanceCents: D(0), // set per state (NC SUA) before use
    maxAllotmentCents: MAX_ALLOTMENT_CONTIGUOUS.map(D),
    perAdditionalAllotmentCents: D(PER_ADDITIONAL_CONTIGUOUS),
    minBenefitCents: D(23), // UNVERIFIED (FY2026 minimum benefit, 48 states)
    assetLimitCents: D(3000), // non-elderly/disabled [verify]
    assetLimitElderlyDisabledCents: D(4500), // [verify]
    expeditedGrossIncomeUnderCents: D(150),
    expeditedResourcesAtMostCents: D(100),
  },

  // Alaska / Hawaii scaffolded with the same structure; ALL figures UNVERIFIED.
  alaska: {
    version: "FY2026-alaska",
    fiscalYear: 2026,
    region: "alaska",
    povertyAnnualBaseCents: D(FPL_2025.alaska.base),
    povertyAnnualPerAdditionalCents: D(FPL_2025.alaska.perAdd),
    grossIncomeLimitFactor: 1.3,
    netIncomeLimitFactor: 1.0,
    bbceGrossLimitFactor: null,
    bbceAssetTestWaived: false,
    earnedIncomeDeductionRate: 0.2,
    standardDeductionCents: STD_DEDUCTION_CONTIGUOUS.map(D), // UNVERIFIED
    medicalDeductionThresholdCents: D(35),
    maxExcessShelterDeductionCents: D(744), // UNVERIFIED
    standardUtilityAllowanceCents: D(0),
    maxAllotmentCents: [0, 372, 683, 979, 1243, 1476, 1772, 1959, 2239].map(D), // UNVERIFIED
    perAdditionalAllotmentCents: D(280), // UNVERIFIED
    minBenefitCents: D(30), // UNVERIFIED
    assetLimitCents: D(3000),
    assetLimitElderlyDisabledCents: D(4500),
    expeditedGrossIncomeUnderCents: D(150),
    expeditedResourcesAtMostCents: D(100),
  },

  hawaii: {
    version: "FY2026-hawaii",
    fiscalYear: 2026,
    region: "hawaii",
    povertyAnnualBaseCents: D(FPL_2025.hawaii.base),
    povertyAnnualPerAdditionalCents: D(FPL_2025.hawaii.perAdd),
    grossIncomeLimitFactor: 1.3,
    netIncomeLimitFactor: 1.0,
    bbceGrossLimitFactor: null,
    bbceAssetTestWaived: false,
    earnedIncomeDeductionRate: 0.2,
    standardDeductionCents: STD_DEDUCTION_CONTIGUOUS.map(D), // UNVERIFIED
    medicalDeductionThresholdCents: D(35),
    maxExcessShelterDeductionCents: D(744), // UNVERIFIED
    standardUtilityAllowanceCents: D(0),
    maxAllotmentCents: [0, 537, 986, 1413, 1794, 2131, 2558, 2827, 3232].map(D), // UNVERIFIED
    perAdditionalAllotmentCents: D(404), // UNVERIFIED
    minBenefitCents: D(41), // UNVERIFIED
    assetLimitCents: D(3000),
    assetLimitElderlyDisabledCents: D(4500),
    expeditedGrossIncomeUnderCents: D(150),
    expeditedResourcesAtMostCents: D(100),
  },
};

export function getPolicy(region: Region = "contiguous"): Policy {
  return POLICIES[region];
}
