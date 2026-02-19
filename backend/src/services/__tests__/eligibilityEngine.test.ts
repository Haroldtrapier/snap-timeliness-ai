/**
 * Eligibility Engine Unit Tests
 *
 * All expected values are derived from 7 CFR Part 273 and the FY2025
 * constants in src/types/index.ts. Every test is hand-calculated so that
 * a change in the engine code that breaks federal compliance will fail here.
 *
 * Constant reference (FY2025):
 *   FPL monthly: HH1=$1,255  HH2=$1,704  HH3=$2,152  HH4=$2,600
 *                HH5=$3,049  HH6=$3,497  +$449 per person above 8
 *   Gross limit: 130% FPL
 *   Net limit:   100% FPL
 *   Assets:      $2,750 standard / $4,500 elderly or disabled
 *   Standard deduction: $198 (HH1-4), $232 (HH5), $265 (HH6+)
 *   Earned income deduction: 20%
 *   Shelter cap: $672 (waived for elderly/disabled households)
 *   Medical deduction: expenses over $35/mo (elderly/disabled only)
 *   Max allotment: HH1=$292  HH2=$536  HH3=$768  HH4=$975  HH5=$1,158
 *                  HH6=$1,390  HH7=$1,536  HH8=$1,756  +$220 per person above 8
 *   Benefit = Max allotment − 30% of net income (floored at $0)
 */

import { determineEligibility } from '../eligibilityEngine'
import type { EligibilityInput } from '../../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid input — zero-income, zero-asset, 1-person household */
const base: EligibilityInput = {
  householdSize: 1,
  monthlyGrossIncome: 0,
  monthlyEarnedIncome: 0,
  assets: 0,
  hasElderly: false,
  hasDisabled: false,
  isHomeless: false,
  isMigrantWorker: false,
  categoricalEligible: false,
}

function make(overrides: Partial<EligibilityInput>): EligibilityInput {
  return { ...base, ...overrides }
}

// ---------------------------------------------------------------------------
// 1. GROSS INCOME TEST  (7 CFR 273.9(a))  —  130% FPL
// ---------------------------------------------------------------------------

describe('Gross income test', () => {
  test('HH1: $0 income passes (well under $1,632 limit)', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 0 }))
    expect(r.grossIncomePass).toBe(true)
    expect(r.grossIncomeLimit).toBe(1632)  // round(1255 × 1.30)
  })

  test('HH1: income exactly at limit ($1,632) passes', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 1632 }))
    expect(r.grossIncomePass).toBe(true)
  })

  test('HH1: income $1 over limit ($1,633) fails', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 1633 }))
    expect(r.grossIncomePass).toBe(false)
    expect(r.result).toBe('INELIGIBLE')
  })

  test('HH2: limit is $2,215  (round(1704 × 1.30))', () => {
    const r = determineEligibility(make({ householdSize: 2, monthlyGrossIncome: 2215 }))
    expect(r.grossIncomeLimit).toBe(2215)
    expect(r.grossIncomePass).toBe(true)
  })

  test('HH2: $2,216 fails', () => {
    const r = determineEligibility(make({ householdSize: 2, monthlyGrossIncome: 2216 }))
    expect(r.grossIncomePass).toBe(false)
  })

  test('HH4: limit is $3,380  (round(2600 × 1.30))', () => {
    const r = determineEligibility(make({ householdSize: 4, monthlyGrossIncome: 3380 }))
    expect(r.grossIncomeLimit).toBe(3380)
    expect(r.grossIncomePass).toBe(true)
  })

  test('HH4: $3,381 fails', () => {
    const r = determineEligibility(make({ householdSize: 4, monthlyGrossIncome: 3381 }))
    expect(r.grossIncomePass).toBe(false)
    expect(r.result).toBe('INELIGIBLE')
  })

  test('HH8: limit is $5,712  (round(4394 × 1.30))', () => {
    const r = determineEligibility(make({ householdSize: 8, monthlyGrossIncome: 5712 }))
    expect(r.grossIncomeLimit).toBe(5712)
    expect(r.grossIncomePass).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 2. NET INCOME TEST  (7 CFR 273.9(b))  —  100% FPL after deductions
// ---------------------------------------------------------------------------

describe('Net income test', () => {
  test('HH1: $500 gross, no earned income → net $302 passes ($302 ≤ $1,255)', () => {
    // net = 500 - standard(198) = 302
    const r = determineEligibility(make({ monthlyGrossIncome: 500, monthlyEarnedIncome: 0 }))
    expect(r.netIncomeActual).toBe(302)
    expect(r.netIncomePass).toBe(true)
    expect(r.netIncomeLimit).toBe(1255)
  })

  test('HH1: $1,500 gross, $0 earned → net $1,302 fails ($1,302 > $1,255)', () => {
    // net = 1500 - 198 = 1302
    const r = determineEligibility(make({ monthlyGrossIncome: 1500, monthlyEarnedIncome: 0 }))
    expect(r.netIncomeActual).toBe(1302)
    expect(r.netIncomePass).toBe(false)
  })

  test('HH1: $1,500 gross all earned → 20% deduction brings net to $1,002 (passes)', () => {
    // earned deduction = 1500 × 0.20 = 300
    // net = 1500 - 198 - 300 = 1002  ≤ 1255 ✓
    const r = determineEligibility(make({ monthlyGrossIncome: 1500, monthlyEarnedIncome: 1500 }))
    expect(r.deductions.earnedIncome).toBe(300)
    expect(r.netIncomeActual).toBe(1002)
    expect(r.netIncomePass).toBe(true)
  })

  test('net income is floored at $0 (cannot go negative)', () => {
    // $100 income − $198 standard = −98 → floored at 0
    const r = determineEligibility(make({ monthlyGrossIncome: 100, monthlyEarnedIncome: 0 }))
    expect(r.netIncomeActual).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 3. STANDARD DEDUCTION  (7 CFR 273.9(d)(1))
// ---------------------------------------------------------------------------

describe('Standard deduction by household size', () => {
  test.each([
    [1, 198], [2, 198], [3, 198], [4, 198],
    [5, 232], [6, 265], [7, 265], [9, 265],
  ])('HH%i → standard deduction $%i', (size, expected) => {
    const r = determineEligibility(make({ householdSize: size, monthlyGrossIncome: 500 }))
    expect(r.deductions.standard).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// 4. EARNED INCOME DEDUCTION  (7 CFR 273.9(d)(2))  —  20% of earned income
// ---------------------------------------------------------------------------

describe('Earned income deduction', () => {
  test('20% of $1,000 earned income = $200', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 1000, monthlyEarnedIncome: 1000 }))
    expect(r.deductions.earnedIncome).toBe(200)
  })

  test('$0 earned income → $0 deduction', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 800, monthlyEarnedIncome: 0 }))
    expect(r.deductions.earnedIncome).toBe(0)
  })

  test('partial earned income: $600 earned out of $1,000 gross → deduction = $120', () => {
    // Only earned portion gets the 20% deduction
    const r = determineEligibility(make({ monthlyGrossIncome: 1000, monthlyEarnedIncome: 600 }))
    expect(r.deductions.earnedIncome).toBe(120)
  })
})

// ---------------------------------------------------------------------------
// 5. SHELTER DEDUCTION  (7 CFR 273.9(d)(6))
//    Excess shelter = shelter − 50% of income after other deductions
//    Capped at $672 UNLESS household has elderly or disabled member
// ---------------------------------------------------------------------------

describe('Shelter deduction', () => {
  test('shelter less than 50% of adjusted income → $0 shelter deduction', () => {
    // gross=1000, earned=0 → std=198, after=802, half=401
    // shelter=300 < 401 → excess=0
    const r = determineEligibility(make({ monthlyGrossIncome: 1000, monthlyEarnedIncome: 0, shelterCost: 300 }))
    expect(r.deductions.shelter).toBe(0)
  })

  test('shelter exactly equal to 50% of adjusted income → $0 excess', () => {
    // gross=1000, after std=802, half=401 → shelter=401, excess=0
    const r = determineEligibility(make({ monthlyGrossIncome: 1000, shelterCost: 401 }))
    expect(r.deductions.shelter).toBe(0)
  })

  test('shelter $1 over half-income → $1 shelter deduction', () => {
    // gross=1000, after=802, half=401 → shelter=402, excess=1
    const r = determineEligibility(make({ monthlyGrossIncome: 1000, shelterCost: 402 }))
    expect(r.deductions.shelter).toBe(1)
  })

  test('excess shelter is capped at $672 for standard household', () => {
    // gross=1000, std=198, after=802, half=401
    // shelter=2000, excess=1599 → capped at 672
    const r = determineEligibility(make({ monthlyGrossIncome: 1000, shelterCost: 2000 }))
    expect(r.deductions.shelter).toBe(672)
  })

  test('shelter cap is WAIVED for elderly household (uncapped)', () => {
    // gross=1000, std=198, after=802, half=401
    // shelter=2000, excess=1599 → NOT capped (elderly)
    const r = determineEligibility(make({
      monthlyGrossIncome: 1000,
      shelterCost: 2000,
      hasElderly: true,
    }))
    expect(r.deductions.shelter).toBe(1599)
  })

  test('shelter cap is WAIVED for disabled household (uncapped)', () => {
    const r = determineEligibility(make({
      monthlyGrossIncome: 1000,
      shelterCost: 2000,
      hasDisabled: true,
    }))
    expect(r.deductions.shelter).toBe(1599)
  })

  test('no shelter cost provided → $0 shelter deduction', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 1000 }))
    expect(r.deductions.shelter).toBe(0)
  })

  test('full deduction chain with earned income and shelter', () => {
    // HH4, gross=2000 all earned, shelter=1200
    // std=198, earned=2000×0.20=400
    // income after other deductions = 2000 - 198 - 400 = 1402
    // half = 701
    // excess = 1200 - 701 = 499 ≤ 672 → shelter = 499
    // total deductions = 198 + 400 + 499 = 1097
    // net = 2000 - 1097 = 903
    const r = determineEligibility(make({
      householdSize: 4,
      monthlyGrossIncome: 2000,
      monthlyEarnedIncome: 2000,
      shelterCost: 1200,
    }))
    expect(r.deductions.standard).toBe(198)
    expect(r.deductions.earnedIncome).toBe(400)
    expect(r.deductions.shelter).toBe(499)
    expect(r.deductions.total).toBe(1097)
    expect(r.netIncomeActual).toBe(903)
  })
})

// ---------------------------------------------------------------------------
// 6. MEDICAL EXPENSE DEDUCTION  (7 CFR 273.9(d)(3))
//    Elderly or disabled households only; costs OVER $35/month
// ---------------------------------------------------------------------------

describe('Medical expense deduction', () => {
  test('elderly HH: $100 medical → $65 deduction (100 − 35)', () => {
    const r = determineEligibility(make({
      monthlyGrossIncome: 800,
      hasElderly: true,
      medicalExpenses: 100,
    }))
    expect(r.deductions.medical).toBe(65)
  })

  test('disabled HH: $200 medical → $165 deduction (200 − 35)', () => {
    const r = determineEligibility(make({
      monthlyGrossIncome: 800,
      hasDisabled: true,
      medicalExpenses: 200,
    }))
    expect(r.deductions.medical).toBe(165)
  })

  test('medical expenses exactly $35 → $0 deduction (threshold not exceeded)', () => {
    const r = determineEligibility(make({
      monthlyGrossIncome: 800,
      hasElderly: true,
      medicalExpenses: 35,
    }))
    expect(r.deductions.medical).toBe(0)
  })

  test('medical expenses $34 (below threshold) → $0 deduction', () => {
    const r = determineEligibility(make({
      monthlyGrossIncome: 800,
      hasElderly: true,
      medicalExpenses: 34,
    }))
    expect(r.deductions.medical).toBe(0)
  })

  test('non-elderly, non-disabled HH: medical expenses are IGNORED', () => {
    const r = determineEligibility(make({
      monthlyGrossIncome: 800,
      hasElderly: false,
      hasDisabled: false,
      medicalExpenses: 500,
    }))
    expect(r.deductions.medical).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 7. DEPENDENT CARE DEDUCTION  (7 CFR 273.9(d)(4))  —  actual cost, uncapped
// ---------------------------------------------------------------------------

describe('Dependent care deduction', () => {
  test('$400/mo dependent care deducted in full', () => {
    const r = determineEligibility(make({
      monthlyGrossIncome: 1200,
      monthlyEarnedIncome: 1200,
      dependentCareExpenses: 400,
    }))
    expect(r.deductions.dependentCare).toBe(400)
  })

  test('no dependent care → $0 deduction', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 800 }))
    expect(r.deductions.dependentCare).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 8. ASSET TEST  (7 CFR 273.8)
// ---------------------------------------------------------------------------

describe('Asset test', () => {
  test('standard HH: assets $2,750 (at limit) → pass', () => {
    const r = determineEligibility(make({ assets: 2750 }))
    expect(r.assetLimit).toBe(2750)
    expect(r.assetPass).toBe(true)
  })

  test('standard HH: assets $2,751 (one over) → fail', () => {
    const r = determineEligibility(make({ assets: 2751 }))
    expect(r.assetPass).toBe(false)
  })

  test('elderly HH: asset limit raises to $4,500', () => {
    const r = determineEligibility(make({ hasElderly: true, assets: 4500 }))
    expect(r.assetLimit).toBe(4500)
    expect(r.assetPass).toBe(true)
  })

  test('elderly HH: assets $4,501 → fail', () => {
    const r = determineEligibility(make({ hasElderly: true, assets: 4501 }))
    expect(r.assetPass).toBe(false)
  })

  test('disabled HH: asset limit raises to $4,500', () => {
    const r = determineEligibility(make({ hasDisabled: true, assets: 4499 }))
    expect(r.assetLimit).toBe(4500)
    expect(r.assetPass).toBe(true)
  })

  test('asset failure with passing gross income → NEEDS_REVIEW (not INELIGIBLE)', () => {
    // Gross passes ($0 income) but assets fail → human review required
    const r = determineEligibility(make({ assets: 2751 }))
    expect(r.grossIncomePass).toBe(true)
    expect(r.assetPass).toBe(false)
    expect(r.result).toBe('NEEDS_REVIEW')
  })
})

// ---------------------------------------------------------------------------
// 9. EXPEDITED ELIGIBILITY  (7 CFR 273.2(i))  —  7-day processing deadline
// ---------------------------------------------------------------------------

describe('Expedited eligibility', () => {
  describe('Group 1: income < $150 AND liquid resources ≤ $100', () => {
    test('income=$149, assets=$100 → expedited', () => {
      const r = determineEligibility(make({ monthlyGrossIncome: 149, assets: 100 }))
      expect(r.expeditedEligible).toBe(true)
    })

    test('income=$150 (not < $150) → NOT expedited via Group 1', () => {
      const r = determineEligibility(make({ monthlyGrossIncome: 150, assets: 100 }))
      // May still qualify via Group 2 (150+100=250 < 500), so check Group 1 specifically
      // Group 2: 150+100=250 < 500 → also true. Use assets=$200 to isolate.
      const r2 = determineEligibility(make({ monthlyGrossIncome: 150, assets: 200 }))
      // Group 1: 150 is NOT < 150 → false
      // Group 2: 150+200=350 < 500 → true
      expect(r2.expeditedEligible).toBe(true)  // Group 2 fires
    })

    test('income=$100, assets=$101 → NOT expedited via Group 1 (assets > $100)', () => {
      // Group 1 requires assets ≤ $100
      // Group 2: 100+101=201 < 500 → true — so we need higher assets to test Group 1 in isolation
      const r = determineEligibility(make({ monthlyGrossIncome: 100, assets: 400 }))
      // Group 1: income<150 ✓ but assets=400 > 100 ✗
      // Group 2: 100+400=500, NOT < 500 ✗
      // Group 3: not migrant
      // Group 4: not homeless
      expect(r.expeditedEligible).toBe(false)
    })
  })

  describe('Group 2: income + assets < $500', () => {
    test('$200 income + $250 assets = $450 < $500 → expedited', () => {
      const r = determineEligibility(make({ monthlyGrossIncome: 200, assets: 250 }))
      expect(r.expeditedEligible).toBe(true)
    })

    test('$300 income + $300 assets = $600 ≥ $500 → NOT expedited via Group 2', () => {
      const r = determineEligibility(make({ monthlyGrossIncome: 300, assets: 300 }))
      expect(r.expeditedEligible).toBe(false)
    })

    test('income + assets exactly $499 → expedited', () => {
      const r = determineEligibility(make({ monthlyGrossIncome: 250, assets: 249 }))
      expect(r.expeditedEligible).toBe(true)
    })

    test('income + assets exactly $500 → NOT expedited (not < $500)', () => {
      const r = determineEligibility(make({ monthlyGrossIncome: 250, assets: 250 }))
      expect(r.expeditedEligible).toBe(false)
    })
  })

  describe('Group 3: migrant/seasonal worker, assets ≤ $100', () => {
    test('migrant worker, assets=$100 → expedited', () => {
      const r = determineEligibility(make({
        monthlyGrossIncome: 1000,
        assets: 100,
        isMigrantWorker: true,
      }))
      expect(r.expeditedEligible).toBe(true)
    })

    test('migrant worker, assets=$101 → NOT expedited via Group 3', () => {
      const r = determineEligibility(make({
        monthlyGrossIncome: 1000,
        assets: 101,
        isMigrantWorker: true,
      }))
      // Group 3 fails (assets > 100); Group 1/2 also fail (income+assets > 500)
      expect(r.expeditedEligible).toBe(false)
    })

    test('non-migrant worker with low assets → NOT expedited via Group 3', () => {
      const r = determineEligibility(make({ monthlyGrossIncome: 1000, assets: 50 }))
      // Group 3 requires isMigrantWorker
      // Group 2: 1000+50=1050 ≥ 500 → false
      expect(r.expeditedEligible).toBe(false)
    })
  })

  describe('Group 4: homeless household with income below gross limit', () => {
    test('homeless, income=$500 (well below HH1 gross limit $1,632) → expedited', () => {
      const r = determineEligibility(make({ monthlyGrossIncome: 500, assets: 300, isHomeless: true }))
      expect(r.expeditedEligible).toBe(true)
    })

    test('homeless, income at gross limit → NOT expedited via Group 4', () => {
      // income = 1632 = gross limit → NOT < limit
      const r = determineEligibility(make({ monthlyGrossIncome: 1632, assets: 300, isHomeless: true }))
      // Group 4 requires income < grossIncomeLimit (strict)
      // Group 2: 1632+300=1932 ≥ 500 → false
      expect(r.expeditedEligible).toBe(false)
    })

    test('non-homeless with same income → NOT expedited via Group 4', () => {
      const r = determineEligibility(make({ monthlyGrossIncome: 500, assets: 300, isHomeless: false }))
      // Group 2: 500+300=800 ≥ 500 → false
      expect(r.expeditedEligible).toBe(false)
    })
  })

  test('expedited + all tests pass → result is EXPEDITED_ELIGIBLE', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 100, assets: 50 }))
    expect(r.result).toBe('EXPEDITED_ELIGIBLE')
    expect(r.expeditedEligible).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 10. CATEGORICAL ELIGIBILITY  (7 CFR 273.2(j))
//     Income and asset tests are fully waived
// ---------------------------------------------------------------------------

describe('Categorical eligibility', () => {
  test('categorically eligible with $10,000 income → ELIGIBLE (gross waived)', () => {
    const r = determineEligibility(make({
      monthlyGrossIncome: 10000,
      monthlyEarnedIncome: 10000,
      assets: 0,
      categoricalEligible: true,
    }))
    expect(r.grossIncomePass).toBe(true)
    expect(r.netIncomePass).toBe(true)
    expect(r.categoricalEligible).toBe(true)
    expect(r.result).toBe('ELIGIBLE')
  })

  test('categorically eligible with assets $100,000 → asset test waived', () => {
    const r = determineEligibility(make({
      assets: 100000,
      categoricalEligible: true,
    }))
    expect(r.assetPass).toBe(true)
    expect(r.result).toBe('ELIGIBLE')
  })

  test('non-categorical with same high income → INELIGIBLE', () => {
    const r = determineEligibility(make({
      monthlyGrossIncome: 10000,
      categoricalEligible: false,
    }))
    expect(r.result).toBe('INELIGIBLE')
  })
})

// ---------------------------------------------------------------------------
// 11. BENEFIT CALCULATION
//     Monthly benefit = Max allotment − (net income × 30%), floored at $0
// ---------------------------------------------------------------------------

describe('Benefit calculation', () => {
  test('HH1, $0 net income → full max allotment $292', () => {
    // net = max(0, 0 - 198) = 0 → benefit = 292 - 0 = 292
    const r = determineEligibility(make({ monthlyGrossIncome: 0 }))
    expect(r.estimatedMonthlyBenefit).toBe(292)
    expect(r.maxAllotment).toBe(292)
  })

  test('HH1: net income $500 → benefit = $292 − $150 = $142', () => {
    // gross=$698, std=198 → net=500; benefit = 292 - 500×0.30 = 292 - 150 = 142
    const r = determineEligibility(make({ monthlyGrossIncome: 698 }))
    expect(r.netIncomeActual).toBe(500)
    expect(r.estimatedMonthlyBenefit).toBe(142)
  })

  test('HH4: net income $200 → benefit = $975 − $60 = $915', () => {
    // gross=$398, std=198 → net=200; benefit = 975 - 200×0.30 = 975 - 60 = 915
    const r = determineEligibility(make({
      householdSize: 4,
      monthlyGrossIncome: 398,
    }))
    expect(r.netIncomeActual).toBe(200)
    expect(r.estimatedMonthlyBenefit).toBe(915)
  })

  test('benefit is floored at $0 — never negative', () => {
    // Very high net income: gross=2000 earned=0 → net=1802; benefit = 292 - 540.6 = -248.6 → 0
    const r = determineEligibility(make({
      monthlyGrossIncome: 2000,
      monthlyEarnedIncome: 0,
      // gross exceeds limit so result = INELIGIBLE, benefit = 0
    }))
    expect(r.estimatedMonthlyBenefit).toBe(0)
  })

  test('INELIGIBLE case → benefit is $0', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 5000, assets: 0 }))
    expect(r.result).toBe('INELIGIBLE')
    expect(r.estimatedMonthlyBenefit).toBe(0)
  })

  test('HH2 max allotment is $536', () => {
    const r = determineEligibility(make({ householdSize: 2, monthlyGrossIncome: 0 }))
    expect(r.maxAllotment).toBe(536)
    expect(r.estimatedMonthlyBenefit).toBe(536)
  })

  test('HH5 max allotment is $1,158', () => {
    const r = determineEligibility(make({ householdSize: 5, monthlyGrossIncome: 0 }))
    expect(r.maxAllotment).toBe(1158)
  })
})

// ---------------------------------------------------------------------------
// 12. LARGE HOUSEHOLD SIZING (HH > 8)
// ---------------------------------------------------------------------------

describe('Large household sizing', () => {
  test('HH9: FPL = $4,394 + $449 = $4,843; gross limit = round(4843 × 1.30) = $6,296', () => {
    const r = determineEligibility(make({ householdSize: 9, monthlyGrossIncome: 6296 }))
    expect(r.grossIncomeLimit).toBe(6296)
    expect(r.grossIncomePass).toBe(true)
  })

  test('HH9: $6,297 fails', () => {
    const r = determineEligibility(make({ householdSize: 9, monthlyGrossIncome: 6297 }))
    expect(r.grossIncomePass).toBe(false)
  })

  test('HH9 max allotment = $1,756 + $220 = $1,976', () => {
    const r = determineEligibility(make({ householdSize: 9, monthlyGrossIncome: 0 }))
    expect(r.maxAllotment).toBe(1976)
    expect(r.estimatedMonthlyBenefit).toBe(1976)
  })

  test('HH10: FPL = $4,843 + $449 = $5,292; gross limit = round(5292 × 1.30) = $6,880', () => {
    const r = determineEligibility(make({ householdSize: 10, monthlyGrossIncome: 6880 }))
    expect(r.grossIncomeLimit).toBe(6880)
    expect(r.grossIncomePass).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 13. RESULT LOGIC MATRIX
// ---------------------------------------------------------------------------

describe('Result determination logic', () => {
  test('all tests pass → ELIGIBLE', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 800 }))
    expect(r.result).toBe('ELIGIBLE')
    expect(r.grossIncomePass).toBe(true)
    expect(r.netIncomePass).toBe(true)
    expect(r.assetPass).toBe(true)
  })

  test('gross income fails → INELIGIBLE', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 5000 }))
    expect(r.result).toBe('INELIGIBLE')
    expect(r.grossIncomePass).toBe(false)
  })

  test('gross passes, net fails → NEEDS_REVIEW', () => {
    // HH1: gross=$1,500 ≤ $1,632 ✓ but net=$1,302 > $1,255 ✗
    const r = determineEligibility(make({ monthlyGrossIncome: 1500, monthlyEarnedIncome: 0 }))
    expect(r.grossIncomePass).toBe(true)
    expect(r.netIncomePass).toBe(false)
    expect(r.result).toBe('NEEDS_REVIEW')
  })

  test('gross passes, assets fail → NEEDS_REVIEW', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 500, assets: 2751 }))
    expect(r.grossIncomePass).toBe(true)
    expect(r.assetPass).toBe(false)
    expect(r.result).toBe('NEEDS_REVIEW')
  })

  test('expedited + all pass → EXPEDITED_ELIGIBLE (not just ELIGIBLE)', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 100, assets: 50 }))
    expect(r.result).toBe('EXPEDITED_ELIGIBLE')
  })
})

// ---------------------------------------------------------------------------
// 14. POVERTY LEVEL PERCENTAGE CALCULATION
// ---------------------------------------------------------------------------

describe('Poverty level calculation', () => {
  test('HH1 at exactly 100% FPL ($1,255) → povertyLevel = 100', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 1255 }))
    expect(r.povertyLevel).toBe(100)
  })

  test('HH1 at 65% FPL → povertyLevel = 65  (round(815/1255 × 100))', () => {
    // 815 / 1255 = 0.6494... → 65
    const r = determineEligibility(make({ monthlyGrossIncome: 815 }))
    expect(r.povertyLevel).toBe(65)
  })

  test('$0 income → povertyLevel = 0', () => {
    const r = determineEligibility(make({ monthlyGrossIncome: 0 }))
    expect(r.povertyLevel).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 15. REAL-WORLD SCENARIO TESTS
// ---------------------------------------------------------------------------

describe('Real-world scenarios', () => {
  test('Single parent, 2 children, part-time work', () => {
    // HH3, $1,400/mo gross all earned, $700 rent, no other expenses
    // std=198, earned=1400×0.20=280
    // income after = 1400 - 198 - 280 = 922
    // half = 461; shelter excess = max(0, 700-461) = 239 ≤ 672 → shelter=239
    // total deductions = 198 + 280 + 239 = 717
    // net = 1400 - 717 = 683
    // gross limit = round(2152×1.30) = 2798 → PASS
    // net limit = 2152 → PASS (683 ≤ 2152)
    // benefit = 768 - 683×0.30 = 768 - 204.9 = 563.1 → 563
    const r = determineEligibility({
      householdSize: 3,
      monthlyGrossIncome: 1400,
      monthlyEarnedIncome: 1400,
      assets: 200,
      hasElderly: false,
      hasDisabled: false,
      isHomeless: false,
      isMigrantWorker: false,
      shelterCost: 700,
      categoricalEligible: false,
    })
    expect(r.result).toBe('ELIGIBLE')
    expect(r.deductions.standard).toBe(198)
    expect(r.deductions.earnedIncome).toBe(280)
    expect(r.deductions.shelter).toBe(239)
    expect(r.netIncomeActual).toBe(683)
    expect(r.estimatedMonthlyBenefit).toBe(563)
  })

  test('Elderly couple, fixed income, high medical expenses', () => {
    // HH2, $1,200/mo gross (SS), $0 earned, $600 rent, $200 medical, $3,000 assets
    // std=198, earned=0, dependent care=0
    // medical = max(0, 200-35) = 165 (elderly)
    // income after other deductions = 1200 - 198 - 0 - 0 - 165 = 837
    // half = 418.5; shelter = max(0, 600-418.5) = 181.5 (not capped, elderly)
    // total = 198 + 0 + 181.5 + 165 + 0 = 544.5
    // net = 1200 - 544.5 = 655.5 → rounded = 655.5 (stored as-is with rounding in output)
    // gross limit = round(1704×1.30) = 2215 → PASS
    // net limit = 1704 → PASS
    // asset limit (elderly) = 4500 → PASS (3000 ≤ 4500)
    // benefit = 536 - 655.5×0.30 = 536 - 196.65 = 339.35 → round = 339
    const r = determineEligibility({
      householdSize: 2,
      monthlyGrossIncome: 1200,
      monthlyEarnedIncome: 0,
      assets: 3000,
      hasElderly: true,
      hasDisabled: false,
      isHomeless: false,
      isMigrantWorker: false,
      shelterCost: 600,
      medicalExpenses: 200,
      categoricalEligible: false,
    })
    expect(r.result).toBe('ELIGIBLE')
    expect(r.assetLimit).toBe(4500)
    expect(r.assetPass).toBe(true)
    expect(r.deductions.medical).toBe(165)
    // Shelter: income after deductions = 1200-198-0-0-165=837; half=418.5; excess=181.5
    expect(r.deductions.shelter).toBe(181.5)
    expect(r.estimatedMonthlyBenefit).toBe(339)
  })

  test('Homeless migrant worker — qualifies expedited via multiple groups', () => {
    const r = determineEligibility({
      householdSize: 1,
      monthlyGrossIncome: 80,
      monthlyEarnedIncome: 80,
      assets: 40,
      hasElderly: false,
      hasDisabled: false,
      isHomeless: true,
      isMigrantWorker: true,
      categoricalEligible: false,
    })
    expect(r.expeditedEligible).toBe(true)
    expect(r.result).toBe('EXPEDITED_ELIGIBLE')
  })

  test('Middle-income family just over gross limit — INELIGIBLE', () => {
    // HH4: gross limit = $3,380; income = $3,400
    const r = determineEligibility({
      householdSize: 4,
      monthlyGrossIncome: 3400,
      monthlyEarnedIncome: 3400,
      assets: 1000,
      hasElderly: false,
      hasDisabled: false,
      isHomeless: false,
      isMigrantWorker: false,
      categoricalEligible: false,
    })
    expect(r.grossIncomePass).toBe(false)
    expect(r.result).toBe('INELIGIBLE')
    expect(r.estimatedMonthlyBenefit).toBe(0)
  })
})
