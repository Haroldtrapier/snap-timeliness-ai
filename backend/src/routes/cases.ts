import { Router, Response } from 'express'
import { body, query, validationResult } from 'express-validator'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../config/database'
import { authenticate, requireRole } from '../middleware/auth'
import { AuthenticatedRequest } from '../types'
import { determineEligibility } from '../services/eligibilityEngine'
import { scoreCase } from '../services/casePrioritizer'
import { screenApplication } from '../services/aiService'
import { getDocumentSummary } from '../services/documentProcessor'

const router = Router()
router.use(authenticate)

function generateCaseNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 900000) + 100000
  return `SNAP-${year}-${rand}`
}

// GET /api/cases — list cases with filters
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { status, priority, assignedToMe, page = '1', limit = '25' } = req.query as Record<string, string>

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (priority) where.priority = priority
  if (assignedToMe === 'true') where.assignedWorkerId = req.user!.id

  // Workers only see their county's cases
  if (req.user!.role === 'ELIGIBILITY_WORKER') {
    where.assignedWorkerId = req.user!.id
  }

  const pageNum = parseInt(page)
  const limitNum = Math.min(parseInt(limit), 100)
  const skip = (pageNum - 1) * limitNum

  const [cases, total] = await Promise.all([
    prisma.snapCase.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: [{ priority: 'asc' }, { applicationDate: 'asc' }],
      include: { assignedWorker: { select: { firstName: true, lastName: true } } },
    }),
    prisma.snapCase.count({ where }),
  ])

  res.json({ cases, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) })
})

// GET /api/cases/:id — get a single case
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const snapCase = await prisma.snapCase.findUnique({
    where: { id: req.params.id },
    include: {
      assignedWorker: { select: { id: true, firstName: true, lastName: true, email: true } },
      documents: true,
      eligibilityChecks: { orderBy: { checkedAt: 'desc' }, take: 1 },
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })

  if (!snapCase) {
    res.status(404).json({ error: 'Case not found' })
    return
  }

  res.json(snapCase)
})

// POST /api/cases — create a new case
router.post(
  '/',
  [
    body('applicantFirstName').trim().notEmpty(),
    body('applicantLastName').trim().notEmpty(),
    body('applicantDob').isISO8601(),
    body('applicantSsn').matches(/^\d{3}-\d{2}-\d{4}$/),
    body('address').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('zipCode').matches(/^\d{5}$/),
    body('householdSize').isInt({ min: 1, max: 20 }),
    body('monthlyGrossIncome').isFloat({ min: 0 }),
    body('monthlyNetIncome').isFloat({ min: 0 }),
    body('assets').isFloat({ min: 0 }),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const data = req.body

    // Run eligibility pre-screening
    const eligibility = determineEligibility({
      householdSize: data.householdSize,
      monthlyGrossIncome: data.monthlyGrossIncome,
      monthlyEarnedIncome: data.monthlyEarnedIncome ?? data.monthlyGrossIncome,
      assets: data.assets,
      hasElderly: data.hasElderly ?? false,
      hasDisabled: data.hasDisabled ?? false,
      isHomeless: data.isHomeless ?? false,
      isMigrantWorker: data.isMigrantWorker ?? false,
      shelterCost: data.shelterCost,
      medicalExpenses: data.medicalExpenses,
      dependentCareExpenses: data.dependentCareExpenses,
      categoricalEligible: data.categoricalEligible ?? false,
    })

    // Score for priority
    const priorityScore = scoreCase({
      applicationDate: new Date(),
      isHomeless: data.isHomeless ?? false,
      isMigrantWorker: data.isMigrantWorker ?? false,
      hasElderly: data.hasElderly ?? false,
      hasDisabled: data.hasDisabled ?? false,
      householdSize: data.householdSize,
      monthlyGrossIncome: data.monthlyGrossIncome,
      assets: data.assets,
      hasMinors: data.hasMinors ?? false,
      expeditedEligible: eligibility.expeditedEligible,
      status: 'PENDING_REVIEW',
    })

    const newCase = await prisma.snapCase.create({
      data: {
        caseNumber: generateCaseNumber(),
        applicantFirstName: data.applicantFirstName,
        applicantLastName: data.applicantLastName,
        applicantDob: new Date(data.applicantDob),
        applicantSsn: data.applicantSsn,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state ?? 'NC',
        zipCode: data.zipCode,
        householdSize: data.householdSize,
        monthlyGrossIncome: data.monthlyGrossIncome,
        monthlyNetIncome: data.monthlyNetIncome,
        assets: data.assets,
        hasElderly: data.hasElderly ?? false,
        hasDisabled: data.hasDisabled ?? false,
        isHomeless: data.isHomeless ?? false,
        isMigrantWorker: data.isMigrantWorker ?? false,
        priority: priorityScore.priority,
        dueDate: priorityScore.dueDate,
        eligibilityChecks: {
          create: {
            grossIncomeLimit: eligibility.grossIncomeLimit,
            netIncomeLimit: eligibility.netIncomeLimit,
            assetLimit: eligibility.assetLimit,
            grossIncomeActual: eligibility.grossIncomeActual,
            netIncomeActual: eligibility.netIncomeActual,
            assetsActual: eligibility.assetsActual,
            grossIncomePass: eligibility.grossIncomePass,
            netIncomePass: eligibility.netIncomePass,
            assetPass: eligibility.assetPass,
            categoricalEligible: eligibility.categoricalEligible,
            expeditedEligible: eligibility.expeditedEligible,
            result: eligibility.result as 'ELIGIBLE' | 'INELIGIBLE' | 'EXPEDITED_ELIGIBLE' | 'PENDING_VERIFICATION' | 'NEEDS_REVIEW',
            estimatedMonthlyBenefit: eligibility.estimatedMonthlyBenefit,
            maxAllotment: eligibility.maxAllotment,
            netIncomeDeductions: eligibility.deductions as unknown as import('@prisma/client').Prisma.InputJsonValue,
            povertyLevel: eligibility.povertyLevel,
            checkedBy: 'AI',
          },
        },
        auditLogs: {
          create: {
            userId: req.user!.id,
            action: 'CASE_CREATED',
            details: { priorityScore: priorityScore.score, eligibilityResult: eligibility.result },
          },
        },
      },
    })

    res.status(201).json({ case: newCase, eligibility, priorityScore })
  }
)

// PATCH /api/cases/:id/assign — assign case to a worker
router.patch(
  '/:id/assign',
  requireRole('SUPERVISOR', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { workerId } = req.body
    const updatedCase = await prisma.snapCase.update({
      where: { id: req.params.id },
      data: {
        assignedWorkerId: workerId,
        status: 'IN_REVIEW',
        reviewStartedAt: new Date(),
        auditLogs: {
          create: { userId: req.user!.id, action: 'CASE_ASSIGNED', details: { workerId } },
        },
      },
    })
    res.json(updatedCase)
  }
)

// PATCH /api/cases/:id/decision — record final decision
router.patch(
  '/:id/decision',
  requireRole('SUPERVISOR', 'ADMIN', 'ELIGIBILITY_WORKER'),
  [
    body('decision').isIn(['APPROVED', 'DENIED', 'WITHDRAWN']),
    body('denialReason').optional().isString(),
    body('notes').optional().isString(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const { decision, denialReason, notes } = req.body
    const existingCase = await prisma.snapCase.findUnique({ where: { id: req.params.id } })
    if (!existingCase) {
      res.status(404).json({ error: 'Case not found' })
      return
    }

    const decisionDate = new Date()
    const processingDays = Math.floor(
      (decisionDate.getTime() - existingCase.applicationDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const updatedCase = await prisma.snapCase.update({
      where: { id: req.params.id },
      data: {
        status: decision,
        denialReason,
        notes,
        decisionMadeAt: decisionDate,
        processingDays,
        auditLogs: {
          create: {
            userId: req.user!.id,
            action: 'DECISION_MADE',
            details: { decision, processingDays, denialReason },
          },
        },
      },
    })
    res.json(updatedCase)
  }
)

// POST /api/cases/:id/ai-screen — trigger AI screening
router.post('/:id/ai-screen', async (req: AuthenticatedRequest, res: Response) => {
  const snapCase = await prisma.snapCase.findUnique({ where: { id: req.params.id } })
  if (!snapCase) {
    res.status(404).json({ error: 'Case not found' })
    return
  }

  const documentsSummary = await getDocumentSummary(snapCase.id)

  const screening = await screenApplication({
    householdSize: snapCase.householdSize,
    monthlyGrossIncome: snapCase.monthlyGrossIncome,
    assets: snapCase.assets,
    hasElderly: snapCase.hasElderly,
    hasDisabled: snapCase.hasDisabled,
    isHomeless: snapCase.isHomeless,
    documentsSummary,
  })

  await prisma.snapCase.update({
    where: { id: req.params.id },
    data: {
      aiScreeningScore: screening.score,
      aiScreeningNotes: screening.notes,
      aiScreenedAt: new Date(),
    },
  })

  res.json(screening)
})

// GET /api/cases/stats/overview — dashboard stats
router.get('/stats/overview', async (_req: AuthenticatedRequest, res: Response) => {
  const [
    total,
    pending,
    expedited,
    approved,
    denied,
    overdue,
    avgProcessingDays,
  ] = await Promise.all([
    prisma.snapCase.count(),
    prisma.snapCase.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.snapCase.count({ where: { priority: 'EXPEDITED' } }),
    prisma.snapCase.count({ where: { status: 'APPROVED' } }),
    prisma.snapCase.count({ where: { status: 'DENIED' } }),
    prisma.snapCase.count({ where: { dueDate: { lt: new Date() }, status: { in: ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_VERIFICATION'] } } }),
    prisma.snapCase.aggregate({ _avg: { processingDays: true }, where: { processingDays: { not: null } } }),
  ])

  res.json({
    total,
    pending,
    expedited,
    approved,
    denied,
    overdue,
    avgProcessingDays: Math.round(avgProcessingDays._avg.processingDays ?? 0),
    timelinessRate: total > 0 ? Math.round(((total - overdue) / total) * 100) : 100,
  })
})

export default router
