import { Router, Response } from 'express'
import prisma from '../config/database'
import { authenticate, requireRole } from '../middleware/auth'
import { AuthenticatedRequest } from '../types'

const router = Router()
router.use(authenticate)
router.use(requireRole('SUPERVISOR', 'ADMIN'))

// GET /api/reports/timeliness — timeliness compliance report
router.get('/timeliness', async (_req: AuthenticatedRequest, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [totalDecided, timelyDecided, expeditedTotal, expeditedTimely] = await Promise.all([
    prisma.snapCase.count({ where: { decisionMadeAt: { not: null }, applicationDate: { gte: thirtyDaysAgo } } }),
    prisma.snapCase.count({ where: { decisionMadeAt: { not: null }, processingDays: { lte: 30 }, applicationDate: { gte: thirtyDaysAgo } } }),
    prisma.snapCase.count({ where: { priority: 'EXPEDITED', decisionMadeAt: { not: null }, applicationDate: { gte: thirtyDaysAgo } } }),
    prisma.snapCase.count({ where: { priority: 'EXPEDITED', decisionMadeAt: { not: null }, processingDays: { lte: 7 }, applicationDate: { gte: thirtyDaysAgo } } }),
  ])

  const timelinessRate = totalDecided > 0 ? Math.round((timelyDecided / totalDecided) * 100) : 100
  const expeditedRate = expeditedTotal > 0 ? Math.round((expeditedTimely / expeditedTotal) * 100) : 100

  res.json({
    period: 'Last 30 days',
    standard: { total: totalDecided, timely: timelyDecided, rate: timelinessRate, federalStandard: 95 },
    expedited: { total: expeditedTotal, timely: expeditedTimely, rate: expeditedRate, federalStandard: 100 },
    compliant: timelinessRate >= 95,
  })
})

// GET /api/reports/workload — workload distribution
router.get('/workload', async (_req: AuthenticatedRequest, res: Response) => {
  const workers = await prisma.user.findMany({
    where: { role: 'ELIGIBILITY_WORKER', isActive: true },
    include: {
      assignedCases: {
        where: { status: { in: ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_VERIFICATION'] } },
        select: { id: true, priority: true, dueDate: true },
      },
    },
  })

  const workload = workers.map(w => ({
    workerId: w.id,
    name: `${w.firstName} ${w.lastName}`,
    activeCases: w.assignedCases.length,
    expeditedCases: w.assignedCases.filter(c => c.priority === 'EXPEDITED').length,
    overdueCount: w.assignedCases.filter(c => c.dueDate < new Date()).length,
  }))

  res.json({ workload, totalWorkers: workers.length, totalActiveCases: workload.reduce((s, w) => s + w.activeCases, 0) })
})

// GET /api/reports/processing-trends — processing time trends
router.get('/processing-trends', async (_req: AuthenticatedRequest, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const decided = await prisma.snapCase.findMany({
    where: { decisionMadeAt: { not: null, gte: thirtyDaysAgo } },
    select: { decisionMadeAt: true, processingDays: true, status: true, priority: true },
    orderBy: { decisionMadeAt: 'asc' },
  })

  // Group by week
  const weeks: Record<string, { total: number; sum: number; approved: number; denied: number }> = {}
  for (const c of decided) {
    if (!c.decisionMadeAt || c.processingDays === null) continue
    const weekStart = new Date(c.decisionMadeAt)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const key = weekStart.toISOString().split('T')[0]
    if (!weeks[key]) weeks[key] = { total: 0, sum: 0, approved: 0, denied: 0 }
    weeks[key].total++
    weeks[key].sum += c.processingDays
    if (c.status === 'APPROVED') weeks[key].approved++
    if (c.status === 'DENIED') weeks[key].denied++
  }

  const trends = Object.entries(weeks).map(([week, data]) => ({
    week,
    count: data.total,
    avgProcessingDays: data.total > 0 ? Math.round(data.sum / data.total) : 0,
    approved: data.approved,
    denied: data.denied,
  }))

  res.json({ trends })
})

// GET /api/reports/pipeline — cases by status (funnel view)
router.get('/pipeline', async (_req: AuthenticatedRequest, res: Response) => {
  const statuses = ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_VERIFICATION', 'APPROVED', 'DENIED', 'WITHDRAWN']

  const counts = await Promise.all(
    statuses.map(async status => ({
      status,
      count: await prisma.snapCase.count({ where: { status: status as 'PENDING_REVIEW' | 'IN_REVIEW' | 'PENDING_VERIFICATION' | 'APPROVED' | 'DENIED' | 'WITHDRAWN' | 'CLOSED' } }),
    }))
  )

  res.json({ pipeline: counts })
})

export default router
