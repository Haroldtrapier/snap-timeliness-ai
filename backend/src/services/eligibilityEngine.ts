/**
 * SNAP Eligibility Engine
 * Implements 7 CFR Part 273 federal SNAP eligibility rules
 * Reference: https://www.ecfr.gov/current/title-7/part-273
 */

import {
  EligibilityInput,
  EligibilityOutput,
  POVERTY_GUIDELINES_MONTHLY,
  POVERTY_ADDITIONAL_PER_PERSON,
  GROSS_INCOME_MULTIPLIER,
  NET_INCOME_MULTIPLIER,
  ASSET_LIMIT_STANDARD,
  ASSET_LIMIT_ELDERLY_DISABLED,
  STANDARD_DEDUCTION,
  STANDARD_DEDUCTION_LARGE_HH,
  EARNED_INCOME_DEDUCTION,
  MAX_ALLOTMENT,
  MAX_ALLOTMENT_ADDITIONAL,
  BENEFIT_REDUCTION_RATE,
} from '../types'

function getPovertyGuideline(householdSize: number): number {
  if (householdSize <= 8) {
    return POVERTY_GUIDELINES_MONTHLY[householdSize]
  }
  return POVERTY_GUIDELINES_MONTHLY[8] + (householdSize - 8) * POVERTY_ADDITIONAL_PER_PERSON
}

function getMaxAllotment(householdSize: number): number {
  if (householdSize <= 8) {
    return MAX_ALLOTMENT[householdSize]
  }
  return MAX_ALLOTMENT[8] + (householdSize - 8) * MAX_ALLOTMENT_ADDITIONAL
}

function getStandardDeduction(householdSize: number): number {
  return householdSize >= 5 ? STANDARD_DEDUCTION_LARGE_HH : (STANDARD_DEDUCTION[householdSize] ?? 198)
}

/**
 * Check expedited service eligibility (7 CFR 273.2(i))
 * Must be processed within 7 days
 */
function checkExpeditedEligibility(input: EligibilityInput, grossIncomeLimit: number): boolean {
  // Group 1: Gross income < $150/month AND liquid resources ≤ $100
  if (input.monthlyGrossIncome < 150 && input.assets <= 100) return true

  // Group 2: Combined monthly gross income + liquid resources < monthly rent/mortgage + utilities
  // Simplified: if income + assets < $500 (basic shelter estimate)
  if (input.monthlyGrossIncome + input.assets < 500) return true

  // Group 3: Migrant or seasonal farm worker household destitute of cash
  if (input.isMigrantWorker && input.assets <= 100) return true

  // Group 4: Homeless household
  if (input.isHomeless && input.monthlyGrossIncome < grossIncomeLimit) return true

  return false
}

/**
 * Calculate net income after allowable deductions (7 CFR 273.9(d))
 */
function calculateNetIncome(input: EligibilityInput): {
  netIncome: number
  deductions: EligibilityOutput['deductions']
} {
  const standardDeduction = getStandardDeduction(input.householdSize)

  // 20% earned income deduction
  const earnedIncomeDeduction = input.monthlyEarnedIncome * EARNED_INCOME_DEDUCTION

  // Dependent care deduction (actual cost, uncapped)
  const dependentCareDeduction = input.dependentCareExpenses ?? 0

  // Medical expense deduction (only for elderly/disabled, costs over $35/month)
  let medicalDeduction = 0
  if ((input.hasElderly || input.hasDisabled) && input.medicalExpenses) {
    medicalDeduction = Math.max(0, input.medicalExpenses - 35)
  }

  // Shelter deduction (excess shelter costs, capped unless elderly/disabled)
  let shelterDeduction = 0
  if (input.shelterCost) {
    const incomeAfterOtherDeductions =
      input.monthlyGrossIncome - standardDeduction - earnedIncomeDeduction - dependentCareDeduction - medicalDeduction
    const halfIncome = incomeAfterOtherDeductions * 0.5
    const excessShelter = Math.max(0, input.shelterCost - halfIncome)

    // FY2025 shelter deduction cap: $672 (waived for elderly/disabled)
    const SHELTER_CAP = 672
    shelterDeduction = input.hasElderly || input.hasDisabled
      ? excessShelter
      : Math.min(excessShelter, SHELTER_CAP)
  }

  const totalDeductions = standardDeduction + earnedIncomeDeduction + dependentCareDeduction + medicalDeduction + shelterDeduction
  const netIncome = Math.max(0, input.monthlyGrossIncome - totalDeductions)

  return {
    netIncome,
    deductions: {
      standard: standardDeduction,
      earnedIncome: Math.round(earnedIncomeDeduction * 100) / 100,
      shelter: Math.round(shelterDeduction * 100) / 100,
      medical: Math.round(medicalDeduction * 100) / 100,
      dependentCare: dependentCareDeduction,
      total: Math.round(totalDeductions * 100) / 100,
    },
  }
}

/**
 * Calculate monthly SNAP benefit
 * Benefit = Max Allotment - 30% of net income
 */
function calculateBenefit(netIncome: number, householdSize: number): number {
  const maxAllotment = getMaxAllotment(householdSize)
  const benefit = maxAllotment - netIncome * BENEFIT_REDUCTION_RATE
  return Math.max(0, Math.round(benefit))
}

/**
 * Main eligibility determination function
 * Implements 7 CFR Part 273 rules
 */
export function determineEligibility(input: EligibilityInput): EligibilityOutput {
  const reasons: string[] = []
  const povertyBaseline = getPovertyGuideline(input.householdSize)
  const maxAllotment = getMaxAllotment(input.householdSize)

  // Income limits
  const grossIncomeLimit = Math.round(povertyBaseline * GROSS_INCOME_MULTIPLIER)
  const netIncomeLimit = Math.round(povertyBaseline * NET_INCOME_MULTIPLIER)

  // Asset limit (higher for elderly/disabled households)
  const assetLimit = (input.hasElderly || input.hasDisabled)
    ? ASSET_LIMIT_ELDERLY_DISABLED
    : ASSET_LIMIT_STANDARD

  // Categorical eligibility check (SNAP-Ed, TANF participants are categorically eligible)
  const categoricalEligible = input.categoricalEligible ?? false
  if (categoricalEligible) {
    reasons.push('Categorically eligible — income/asset tests waived')
  }

  // Gross income test (7 CFR 273.9(a)) — waived if categorically eligible
  const grossIncomePass = categoricalEligible || input.monthlyGrossIncome <= grossIncomeLimit
  if (!grossIncomePass) {
    reasons.push(
      `Gross income $${input.monthlyGrossIncome}/mo exceeds limit of $${grossIncomeLimit}/mo (130% FPL for ${input.householdSize}-person household)`
    )
  }

  // Asset test — waived if categorically eligible
  const assetPass = categoricalEligible || input.assets <= assetLimit
  if (!assetPass) {
    reasons.push(
      `Assets $${input.assets} exceed limit of $${assetLimit} for ${input.hasElderly || input.hasDisabled ? 'elderly/disabled' : 'standard'} household`
    )
  }

  // Net income test (7 CFR 273.9(b))
  const { netIncome, deductions } = calculateNetIncome(input)
  const netIncomePass = categoricalEligible || netIncome <= netIncomeLimit
  if (!netIncomePass) {
    reasons.push(
      `Net income $${Math.round(netIncome)}/mo (after deductions) exceeds limit of $${netIncomeLimit}/mo (100% FPL)`
    )
  }

  // Expedited eligibility check
  const expeditedEligible = checkExpeditedEligibility(input, grossIncomeLimit)
  if (expeditedEligible) {
    reasons.push('Qualifies for expedited processing — must be processed within 7 days')
  }

  // Poverty level percentage
  const povertyLevel = Math.round((input.monthlyGrossIncome / povertyBaseline) * 100)

  // Overall result
  let result: EligibilityOutput['result']
  const overallPass = grossIncomePass && netIncomePass && assetPass

  if (expeditedEligible && overallPass) {
    result = 'EXPEDITED_ELIGIBLE'
  } else if (overallPass) {
    result = 'ELIGIBLE'
    reasons.push('All income and asset tests passed')
  } else if (!grossIncomePass) {
    // Failed gross income — ineligible regardless (unless categorical)
    result = 'INELIGIBLE'
  } else if (!netIncomePass || !assetPass) {
    result = 'NEEDS_REVIEW'
    reasons.push('Borderline case — recommend supervisor review before final determination')
  } else {
    result = 'INELIGIBLE'
  }

  const estimatedMonthlyBenefit = overallPass ? calculateBenefit(netIncome, input.householdSize) : 0

  return {
    result,
    grossIncomeLimit,
    netIncomeLimit,
    assetLimit,
    grossIncomeActual: input.monthlyGrossIncome,
    netIncomeActual: Math.round(netIncome * 100) / 100,
    assetsActual: input.assets,
    grossIncomePass,
    netIncomePass,
    assetPass,
    categoricalEligible,
    expeditedEligible,
    estimatedMonthlyBenefit,
    maxAllotment,
    povertyLevel,
    deductions,
    reasons,
  }
}
