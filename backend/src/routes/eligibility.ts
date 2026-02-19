import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { authenticate } from '../middleware/auth'
import { determineEligibility } from '../services/eligibilityEngine'
import { generateDenialExplanation } from '../services/aiService'
import { EligibilityInput } from '../types'

const router = Router()
router.use(authenticate)

// POST /api/eligibility/check — standalone eligibility check
router.post(
  '/check',
  [
    body('householdSize').isInt({ min: 1, max: 20 }),
    body('monthlyGrossIncome').isFloat({ min: 0 }),
    body('monthlyEarnedIncome').isFloat({ min: 0 }),
    body('assets').isFloat({ min: 0 }),
    body('hasElderly').isBoolean(),
    body('hasDisabled').isBoolean(),
    body('isHomeless').isBoolean(),
    body('isMigrantWorker').isBoolean(),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const input: EligibilityInput = {
      householdSize: req.body.householdSize,
      monthlyGrossIncome: req.body.monthlyGrossIncome,
      monthlyEarnedIncome: req.body.monthlyEarnedIncome,
      assets: req.body.assets,
      hasElderly: req.body.hasElderly,
      hasDisabled: req.body.hasDisabled,
      isHomeless: req.body.isHomeless,
      isMigrantWorker: req.body.isMigrantWorker,
      shelterCost: req.body.shelterCost,
      medicalExpenses: req.body.medicalExpenses,
      dependentCareExpenses: req.body.dependentCareExpenses,
      categoricalEligible: req.body.categoricalEligible ?? false,
    }

    const result = determineEligibility(input)
    res.json(result)
  }
)

// POST /api/eligibility/denial-letter — generate denial explanation
router.post(
  '/denial-letter',
  [
    body('reasons').isArray({ min: 1 }),
    body('householdSize').isInt({ min: 1 }),
    body('language').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const explanation = await generateDenialExplanation(
      req.body.reasons,
      req.body.householdSize,
      req.body.language ?? 'English'
    )
    res.json({ explanation })
  }
)

// GET /api/eligibility/guidelines — return current SNAP guidelines
router.get('/guidelines', (_req: Request, res: Response) => {
  res.json({
    fiscalYear: 2025,
    effectiveDate: '2024-10-01',
    grossIncomeMultiplier: 1.30,
    netIncomeMultiplier: 1.00,
    assetLimits: { standard: 2750, elderlyDisabled: 4500 },
    povertyGuidelinesMonthly: {
      1: 1255, 2: 1704, 3: 2152, 4: 2600,
      5: 3049, 6: 3497, 7: 3945, 8: 4394,
      additionalPerPerson: 449,
    },
    grossIncomeLimits: {
      1: 1632, 2: 2215, 3: 2798, 4: 3380,
      5: 3963, 6: 4546, 7: 5129, 8: 5712,
      additionalPerPerson: 583,
    },
    maxAllotments: {
      1: 292, 2: 536, 3: 768, 4: 975,
      5: 1158, 6: 1390, 7: 1536, 8: 1756,
      additionalPerPerson: 220,
    },
    standardDeductions: { 1: 198, 2: 198, 3: 198, 4: 198, 5: 232, 6: 265 },
    earnedIncomeDeduction: 0.20,
    shelterDeductionCap: 672,
    expeditedCriteria: [
      'Gross income < $150/month AND liquid resources ≤ $100',
      'Combined income + resources < monthly rent/mortgage + utilities',
      'Migrant or seasonal farm worker destitute of cash',
      'Homeless household',
    ],
    processingDeadlines: { standard: 30, expedited: 7 },
  })
})

export default router
