import { describe, it, expect } from "vitest";
import {
  calculateEligibility,
  maxAllotmentCents,
  monthlyPovertyCents,
  getPolicy,
} from "@/lib/eligibility";
import type { EligibilityInput, Policy } from "@/lib/eligibility";

// A synthetic policy with round numbers so expected outputs can be hand-computed.
// This isolates the ENGINE MATH from the real-world FY2026 dollar constants.
const $ = (dollars: number) => Math.round(dollars * 100);

const TEST_POLICY: Policy = {
  version: "TEST",
  fiscalYear: 2026,
  region: "contiguous",
  povertyAnnualBaseCents: $(12000), // → $1000/mo poverty for size 1
  povertyAnnualPerAdditionalCents: $(6000), // → +$500/mo per person
  grossIncomeLimitFactor: 1.3,
  netIncomeLimitFactor: 1.0,
  bbceGrossLimitFactor: null, // isolate the base federal path
  bbceAssetTestWaived: false,
  earnedIncomeDeductionRate: 0.2,
  standardDeductionCents: [0, $(100), $(100), $(100), $(100)],
  medicalDeductionThresholdCents: $(35),
  maxExcessShelterDeductionCents: $(500),
  standardUtilityAllowanceCents: $(50),
  maxAllotmentCents: [0, $(300), $(500), $(700), $(900)],
  perAdditionalAllotmentCents: $(200),
  minBenefitCents: $(23),
  assetLimitCents: $(3000),
  assetLimitElderlyDisabledCents: $(4500),
  expeditedGrossIncomeUnderCents: $(150),
  expeditedResourcesAtMostCents: $(100),
};

const BBCE_POLICY: Policy = {
  ...TEST_POLICY,
  version: "TEST-BBCE",
  bbceGrossLimitFactor: 2.0,
  bbceAssetTestWaived: true,
};

function input(overrides: Partial<EligibilityInput>): EligibilityInput {
  return {
    householdSize: 1,
    hasElderlyOrDisabledMember: false,
    earnedIncomeCents: 0,
    unearnedIncomeCents: 0,
    ...overrides,
  };
}

describe("calculateEligibility — base federal path", () => {
  it("typical eligible 3-person family (hand-computed)", () => {
    const r = calculateEligibility(
      input({
        householdSize: 3,
        earnedIncomeCents: $(1000),
        rentMortgageCents: $(600),
        useStandardUtilityAllowance: true,
      }),
      TEST_POLICY,
    );
    // gross 100000 ≤ grossLimit 260000; adjusted 70000; excess shelter 30000;
    // net 40000 ≤ netLimit 200000; benefit 70000 − 12000 = 58000.
    expect(r.grossTestPass).toBe(true);
    expect(r.netIncomeCents).toBe($(400));
    expect(r.netTestPass).toBe(true);
    expect(r.likelyEligible).toBe(true);
    expect(r.estimatedMonthlyBenefitCents).toBe($(580));
    expect(r.expedited).toBe(false);
  });

  it("fails the gross income test when income is too high", () => {
    const r = calculateEligibility(
      input({ householdSize: 1, earnedIncomeCents: $(2000) }),
      TEST_POLICY,
    );
    expect(r.grossTestApplies).toBe(true);
    expect(r.grossTestPass).toBe(false);
    expect(r.likelyEligible).toBe(false);
    expect(r.estimatedMonthlyBenefitCents).toBe(0);
  });

  it("floors an eligible 1–2 person benefit at the minimum", () => {
    // size 1, unearned 105000 → net 95000 (≤ netLimit 100000, eligible);
    // raw benefit 30000 − 28500 = 1500 < min 2300 → floored to 2300.
    const r = calculateEligibility(
      input({ householdSize: 1, unearnedIncomeCents: $(1050) }),
      TEST_POLICY,
    );
    expect(r.likelyEligible).toBe(true);
    expect(r.estimatedMonthlyBenefitCents).toBe(TEST_POLICY.minBenefitCents);
  });
});

describe("elderly/disabled households", () => {
  it("waives the gross test and uncaps the shelter deduction", () => {
    // size 2 elderly, unearned 250000 (above gross limit but waived), medical
    // 50000 → deduction 46500, uncapped excess shelter 53250, net 140250.
    const r = calculateEligibility(
      input({
        householdSize: 2,
        hasElderlyOrDisabledMember: true,
        unearnedIncomeCents: $(2500),
        medicalExpensesCents: $(500),
        rentMortgageCents: $(1500),
      }),
      TEST_POLICY,
    );
    expect(r.grossTestApplies).toBe(false);
    expect(r.grossTestPass).toBe(true);
    expect(r.netIncomeCents).toBe($(1402.5));
    expect(r.netTestPass).toBe(true);
    expect(r.likelyEligible).toBe(true);
    // Benefit 50000 − round(140250*0.3)=42075 → 7925. (Capped shelter would give 6950.)
    expect(r.estimatedMonthlyBenefitCents).toBe($(79.25));
  });
});

describe("categorical eligibility (BBCE)", () => {
  it("waives gross + asset tests but still requires the net test", () => {
    const r = calculateEligibility(
      input({
        householdSize: 1,
        unearnedIncomeCents: $(1800), // > 130% but ≤ 200% FPL
        liquidResourcesCents: $(5000), // would fail asset test if it applied
      }),
      BBCE_POLICY,
    );
    expect(r.categoricallyEligible).toBe(true);
    expect(r.grossTestApplies).toBe(false);
    expect(r.assetTestApplies).toBe(false);
    // net 170000 > netLimit 100000 → not eligible despite categorical status.
    expect(r.netTestPass).toBe(false);
    expect(r.likelyEligible).toBe(false);
  });

  it("lets an asset-rich but low-income household qualify (asset waived)", () => {
    const r = calculateEligibility(
      input({
        householdSize: 1,
        unearnedIncomeCents: $(500),
        liquidResourcesCents: $(5000),
      }),
      BBCE_POLICY,
    );
    expect(r.assetTestApplies).toBe(false);
    expect(r.likelyEligible).toBe(true);
    // net 40000 → 30000 − 12000 = 18000.
    expect(r.estimatedMonthlyBenefitCents).toBe($(180));
  });
});

describe("expedited screening", () => {
  it("flags very low income + resources", () => {
    const r = calculateEligibility(
      input({ householdSize: 2, earnedIncomeCents: $(100), liquidResourcesCents: $(50) }),
      TEST_POLICY,
    );
    expect(r.expedited).toBe(true);
  });

  it("flags when income + resources are below shelter costs", () => {
    const r = calculateEligibility(
      input({ householdSize: 2, earnedIncomeCents: $(200), rentMortgageCents: $(300) }),
      TEST_POLICY,
    );
    expect(r.expedited).toBe(true);
  });

  it("flags destitute migrant workers unconditionally", () => {
    const r = calculateEligibility(
      input({ householdSize: 1, earnedIncomeCents: $(5000), destituteMigrantWorker: true }),
      TEST_POLICY,
    );
    expect(r.expedited).toBe(true);
  });
});

describe("boundary conditions", () => {
  it("net income exactly at the limit passes (≤, not <)", () => {
    // size 1, unearned 110000, standard 10000 → net 100000 == netLimit 100000.
    const r = calculateEligibility(
      input({ householdSize: 1, unearnedIncomeCents: $(1100) }),
      TEST_POLICY,
    );
    expect(r.netIncomeCents).toBe($(1000));
    expect(r.netTestPass).toBe(true);
  });

  it("one dollar over the net limit fails", () => {
    const r = calculateEligibility(
      input({ householdSize: 1, unearnedIncomeCents: $(1101) }),
      TEST_POLICY,
    );
    expect(r.netTestPass).toBe(false);
    expect(r.likelyEligible).toBe(false);
  });
});

describe("invariants (property checks)", () => {
  const samples: EligibilityInput[] = [
    input({ householdSize: 1, earnedIncomeCents: $(0) }),
    input({ householdSize: 4, earnedIncomeCents: $(1500), rentMortgageCents: $(900) }),
    input({ householdSize: 6, unearnedIncomeCents: $(3000) }),
    input({ householdSize: 2, earnedIncomeCents: $(50), liquidResourcesCents: $(10) }),
  ];

  it("benefit is never negative and never exceeds the household's max allotment", () => {
    for (const s of samples) {
      const r = calculateEligibility(s, TEST_POLICY);
      expect(r.estimatedMonthlyBenefitCents).toBeGreaterThanOrEqual(0);
      expect(r.estimatedMonthlyBenefitCents).toBeLessThanOrEqual(
        maxAllotmentCents(TEST_POLICY, s.householdSize),
      );
    }
  });

  it("ineligible households get a $0 estimate and a non-empty rule trace", () => {
    const r = calculateEligibility(
      input({ householdSize: 1, earnedIncomeCents: $(9999) }),
      TEST_POLICY,
    );
    expect(r.likelyEligible).toBe(false);
    expect(r.estimatedMonthlyBenefitCents).toBe(0);
    expect(r.ruleTrace.length).toBeGreaterThan(0);
    expect(r.disclaimer).toMatch(/not a decision/i);
  });
});

describe("real FY2026 contiguous policy sanity", () => {
  const p = getPolicy("contiguous");

  it("uses the confirmed max allotments ($298 for 1, $994 for 4)", () => {
    expect(maxAllotmentCents(p, 1)).toBe($(298));
    expect(maxAllotmentCents(p, 4)).toBe($(994));
  });

  it("monthly poverty for a single person is in a plausible range", () => {
    const m = monthlyPovertyCents(p, 1);
    // 2025 FPL $15,650/yr → ~$1,304/mo.
    expect(m).toBeGreaterThan($(1200));
    expect(m).toBeLessThan($(1400));
  });

  it("a zero-income single person receives the full max allotment", () => {
    const r = calculateEligibility(input({ householdSize: 1 }), p);
    expect(r.likelyEligible).toBe(true);
    expect(r.estimatedMonthlyBenefitCents).toBe(maxAllotmentCents(p, 1));
  });
});
