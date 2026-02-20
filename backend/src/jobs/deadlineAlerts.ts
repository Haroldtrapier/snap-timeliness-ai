import cron from 'node-cron'
import prisma from '../config/database'
import { sendDeadlineAlert, sendSupervisorDailySummary } from '../services/emailService'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'

/**
 * Runs every morning at 7:00 AM.
 * 1. Sends individual alerts to assigned workers for overdue, due-today, and due-tomorrow cases.
 * 2. Sends a daily summary digest to all supervisors.
 */
export function startDeadlineAlertJob(): void {
  // Worker alerts: 7:00 AM daily
  cron.schedule('0 7 * * *', async () => {
    console.log('[DeadlineAlerts] Running deadline alert job...')
    try {
      await runWorkerAlerts()
      await runSupervisorSummary()
      console.log('[DeadlineAlerts] Done')
    } catch (err) {
      console.error('[DeadlineAlerts] Error:', err)
    }
  })

  // Expedited-only reminder: also at 2:00 PM to catch new expedited cases
  cron.schedule('0 14 * * *', async () => {
    console.log('[DeadlineAlerts] Running expedited-case afternoon check...')
    try {
      await runWorkerAlerts({ expeditedOnly: true })
    } catch (err) {
      console.error('[DeadlineAlerts] Expedited check error:', err)
    }
  })

  console.log('[DeadlineAlerts] Scheduled: 7:00 AM daily (all cases) + 2:00 PM (expedited only)')
}

async function runWorkerAlerts(opts: { expeditedOnly?: boolean } = {}): Promise<void> {
  const now = new Date()
  const endOfTomorrow = new Date(now)
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 2)
  endOfTomorrow.setHours(23, 59, 59, 999)

  const activeCases = await prisma.snapCase.findMany({
    where: {
      status: { in: ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_VERIFICATION'] },
      assignedWorkerId: { not: null },
      dueDate: { lte: endOfTomorrow },
      ...(opts.expeditedOnly ? { priority: 'EXPEDITED' } : {}),
    },
    include: {
      assignedWorker: { select: { email: true, firstName: true, lastName: true } },
    },
  })

  const alertPromises = activeCases
    .filter(c => c.assignedWorker?.email)
    .map(async c => {
      const daysRemaining = Math.ceil(
        (c.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      // Only alert for <=1 day remaining or overdue (avoids spam for 2-day window)
      if (daysRemaining > 1) return

      try {
        await sendDeadlineAlert({
          workerEmail: c.assignedWorker!.email,
          workerName: `${c.assignedWorker!.firstName} ${c.assignedWorker!.lastName}`,
          caseNumber: c.caseNumber,
          applicantName: `${c.applicantFirstName} ${c.applicantLastName}`,
          dueDate: c.dueDate,
          daysRemaining,
          isExpedited: c.priority === 'EXPEDITED',
          caseUrl: `${APP_URL}/cases/${c.id}`,
        })
      } catch (err) {
        console.error(`[DeadlineAlerts] Failed to send alert for case ${c.caseNumber}:`, err)
      }
    })

  await Promise.allSettled(alertPromises)
}

async function runSupervisorSummary(): Promise<void> {
  const now = new Date()

  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const tomorrowStart = new Date(now)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  tomorrowStart.setHours(0, 0, 0, 0)

  const tomorrowEnd = new Date(now)
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)
  tomorrowEnd.setHours(23, 59, 59, 999)

  const openStatuses = { in: ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_VERIFICATION'] as const }

  const [overdueCount, dueTodayCount, dueTomorrowCount, totalPendingCount, supervisors] =
    await Promise.all([
      prisma.snapCase.count({ where: { status: openStatuses, dueDate: { lt: now } } }),
      prisma.snapCase.count({ where: { status: openStatuses, dueDate: { gte: now, lte: todayEnd } } }),
      prisma.snapCase.count({ where: { status: openStatuses, dueDate: { gte: tomorrowStart, lte: tomorrowEnd } } }),
      prisma.snapCase.count({ where: { status: openStatuses } }),
      prisma.user.findMany({
        where: { role: { in: ['SUPERVISOR', 'ADMIN'] }, isActive: true },
        select: { email: true, firstName: true, lastName: true },
      }),
    ])

  const summaryPromises = supervisors.map(async s => {
    try {
      await sendSupervisorDailySummary({
        supervisorEmail: s.email,
        supervisorName: `${s.firstName} ${s.lastName}`,
        overdueCount,
        dueTodayCount,
        dueTomorrowCount,
        totalPendingCount,
        appUrl: APP_URL,
      })
    } catch (err) {
      console.error(`[DeadlineAlerts] Failed to send summary to ${s.email}:`, err)
    }
  })

  await Promise.allSettled(summaryPromises)
}
