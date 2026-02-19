/**
 * Case Prioritization Service
 * Scores and prioritizes SNAP cases based on urgency, compliance deadlines, and need.
 */

import { PriorityScore } from '../types'

interface CaseInput {
  applicationDate: Date
  isHomeless: boolean
  isMigrantWorker: boolean
  hasElderly: boolean
  hasDisabled: boolean
  householdSize: number
  monthlyGrossIncome: number
  assets: number
  hasMinors: boolean
  expeditedEligible?: boolean
  status: string
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Score a case and determine its priority.
 * Returns a score 0-100 (higher = more urgent) and a priority tier.
 */
export function scoreCase(input: CaseInput): PriorityScore {
  let score = 0
  const factors: string[] = []

  // Expedited eligibility = highest urgency (7-day deadline)
  if (input.expeditedEligible) {
    score += 50
    factors.push('Expedited eligibility — 7-day federal deadline')
  }

  // Application age scoring — federal 30-day deadline
  const age = daysSince(input.applicationDate)
  if (age >= 25) {
    score += 30
    factors.push(`Critical: ${age} days old — approaching 30-day federal deadline`)
  } else if (age >= 20) {
    score += 20
    factors.push(`Warning: ${age} days old — 30-day deadline approaching`)
  } else if (age >= 15) {
    score += 10
    factors.push(`${age} days old — monitor closely`)
  } else if (age >= 7) {
    score += 5
    factors.push(`${age} days old`)
  }

  // Vulnerable population flags
  if (input.isHomeless) {
    score += 15
    factors.push('Homeless household')
  }
  if (input.isMigrantWorker) {
    score += 12
    factors.push('Migrant or seasonal worker')
  }
  if (input.hasDisabled) {
    score += 10
    factors.push('Household member with disability')
  }
  if (input.hasElderly) {
    score += 8
    factors.push('Elderly household member (60+)')
  }
  if (input.hasMinors) {
    score += 8
    factors.push('Children in household')
  }

  // Large household = greater need
  if (input.householdSize >= 5) {
    score += 5
    factors.push(`Large household (${input.householdSize} members)`)
  }

  // Zero or very low income
  if (input.monthlyGrossIncome === 0) {
    score += 10
    factors.push('No income reported')
  } else if (input.monthlyGrossIncome < 300) {
    score += 5
    factors.push('Very low income')
  }

  // Zero assets with low income = destitute
  if (input.assets < 100 && input.monthlyGrossIncome < 500) {
    score += 8
    factors.push('Minimal resources — potential destitution')
  }

  // Cap at 100
  score = Math.min(100, score)

  // Determine priority tier and due date
  let priority: PriorityScore['priority']
  let deadlineDays: number

  if (input.expeditedEligible) {
    priority = 'EXPEDITED'
    deadlineDays = 7
  } else if (score >= 70) {
    priority = 'HIGH'
    deadlineDays = 30
  } else if (score >= 40) {
    priority = 'NORMAL'
    deadlineDays = 30
  } else {
    priority = 'LOW'
    deadlineDays = 30
  }

  const dueDate = addDays(input.applicationDate, deadlineDays)

  return {
    score: Math.round(score),
    priority,
    factors,
    dueDate,
  }
}

/**
 * Sort a list of cases by priority score descending.
 */
export function rankCases<T extends { priorityScore?: number; applicationDate: Date }>(cases: T[]): T[] {
  return [...cases].sort((a, b) => {
    // Higher score = more urgent
    const scoreDiff = (b.priorityScore ?? 0) - (a.priorityScore ?? 0)
    if (scoreDiff !== 0) return scoreDiff
    // Tiebreak: older applications first
    return a.applicationDate.getTime() - b.applicationDate.getTime()
  })
}
