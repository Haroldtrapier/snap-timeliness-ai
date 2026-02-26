import { Request } from 'express'

// Defined locally to avoid a hard dependency on the generated @prisma/client types
type Role = 'ELIGIBILITY_WORKER' | 'SUPERVISOR' | 'ADMIN'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: Role
    county: string
  }
}

export interface JWTPayload {
  id: string
  email: string
  role: Role
  county: string
}

// 2025 Federal Poverty Level guidelines (48 contiguous states + DC)
// 130% for gross income test, 100% for net income test
export const POVERTY_GUIDELINES_MONTHLY: Record<number, number> = {
  1: 1255,
  2: 1704,
  3: 2152,
  4: 2600,
  5: 3049,
  6: 3497,
  7: 3945,
  8: 4394,
}
export const POVERTY_ADDITIONAL_PER_PERSON = 449

// SNAP gross income limit: 130% FPL
export const GROSS_INCOME_MULTIPLIER = 1.30
// SNAP net income limit: 100% FPL
export const NET_INCOME_MULTIPLIER = 1.00

// Asset limits (2025)
export const ASSET_LIMIT_STANDARD = 2750
export const ASSET_LIMIT_ELDERLY_DISABLED = 4500

// Standard deduction by household size (2025)
export const STANDARD_DEDUCTION: Record<number, number> = {
  1: 198,
  2: 198,
  3: 198,
  4: 198,
  5: 232,
  6: 265,
}
export const STANDARD_DEDUCTION_LARGE_HH = 265

// Earned income deduction: 20% of earned income
export const EARNED_INCOME_DEDUCTION = 0.20

// Maximum monthly allotments by household size (FY 2025)
export const MAX_ALLOTMENT: Record<number, number> = {
  1: 292,
  2: 536,
  3: 768,
  4: 975,
  5: 1158,
  6: 1390,
  7: 1536,
  8: 1756,
}
export const MAX_ALLOTMENT_ADDITIONAL = 220

// Thrifty Food Plan (30% of net income goes toward food)
export const BENEFIT_REDUCTION_RATE = 0.30

export interface EligibilityInput {
  householdSize: number
  monthlyGrossIncome: number
  monthlyEarnedIncome: number
  assets: number
  hasElderly: boolean
  hasDisabled: boolean
  isHomeless: boolean
  isMigrantWorker: boolean
  shelterCost?: number
  medicalExpenses?: number
  dependentCareExpenses?: number
  categoricalEligible?: boolean
}

export interface EligibilityOutput {
  result: 'ELIGIBLE' | 'INELIGIBLE' | 'EXPEDITED_ELIGIBLE' | 'NEEDS_REVIEW'
  grossIncomeLimit: number
  netIncomeLimit: number
  assetLimit: number
  grossIncomeActual: number
  netIncomeActual: number
  assetsActual: number
  grossIncomePass: boolean
  netIncomePass: boolean
  assetPass: boolean
  categoricalEligible: boolean
  expeditedEligible: boolean
  estimatedMonthlyBenefit: number
  maxAllotment: number
  povertyLevel: number
  deductions: {
    standard: number
    earnedIncome: number
    shelter: number
    medical: number
    dependentCare: number
    total: number
  }
  reasons: string[]
}

export interface PriorityScore {
  score: number          // 0-100
  priority: 'EXPEDITED' | 'HIGH' | 'NORMAL' | 'LOW'
  factors: string[]
  dueDate: Date
}

export interface DocumentExtractionResult {
  documentType: string
  extractedFields: Record<string, string | number | boolean>
  confidence: number
  flaggedIssues: string[]
  requiresHumanReview: boolean
}
