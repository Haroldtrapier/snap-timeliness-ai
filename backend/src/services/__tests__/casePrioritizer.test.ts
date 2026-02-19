/**
 * Case Prioritizer Unit Tests
 *
 * Scoring rules:
 *   Expedited eligible       +50  → priority = EXPEDITED, due = app date + 7
 *   Age ≥ 25 days            +30  (critical)
 *   Age ≥ 20 days            +20  (warning)
 *   Age ≥ 15 days            +10  (monitor)
 *   Age ≥  7 days            + 5
 *   Homeless                 +15
 *   Migrant worker           +12
 *   Disabled member          +10
 *   Elderly member           + 8
 *   Has minors               + 8
 *   HH size ≥ 5              + 5
 *   Zero income              +10
 *   Income < $300            + 5
 *   Assets < $100 AND income < $500  +8  (destitution)
 *   Score is capped at 100.
 *
 *   Priority tiers (non-expedited):
 *     score ≥ 70  → HIGH
 *     score ≥ 40  → NORMAL
 *     score  < 40 → LOW
 */

import { scoreCase, rankCases } from '../casePrioritizer'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
}

const base = {
  applicationDate: daysAgo(1),
  isHomeless: false,
  isMigrantWorker: false,
  hasElderly: false,
  hasDisabled: false,
  householdSize: 1,
  monthlyGrossIncome: 1000,
  assets: 500,
  hasMinors: false,
  expeditedEligible: false,
  status: 'PENDING_REVIEW',
}

// ---------------------------------------------------------------------------
// 1. EXPEDITED FLAG
// ---------------------------------------------------------------------------

describe('Expedited eligibility', () => {
  test('expedited case scores +50 and gets EXPEDITED priority', () => {
    const r = scoreCase({ ...base, expeditedEligible: true })
    expect(r.score).toBeGreaterThanOrEqual(50)
    expect(r.priority).toBe('EXPEDITED')
  })

  test('expedited due date = application date + 7 days', () => {
    const appDate = daysAgo(2)
    const r = scoreCase({ ...base, applicationDate: appDate, expeditedEligible: true })
    const expected = new Date(appDate)
    expected.setDate(expected.getDate() + 7)
    expect(r.dueDate.toDateString()).toBe(expected.toDateString())
  })

  test('non-expedited case does NOT get EXPEDITED priority', () => {
    const r = scoreCase({ ...base, expeditedEligible: false })
    expect(r.priority).not.toBe('EXPEDITED')
  })

  test('factors list mentions 7-day federal deadline for expedited', () => {
    const r = scoreCase({ ...base, expeditedEligible: true })
    expect(r.factors.some(f => f.includes('7-day'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 2. APPLICATION AGE SCORING
// ---------------------------------------------------------------------------

describe('Application age scoring', () => {
  test('age 0 days (today) → +0 from age', () => {
    const r = scoreCase({ ...base, applicationDate: new Date() })
    // Only non-age factor is nothing (income=1000, assets=500, no flags)
    expect(r.score).toBe(0)
  })

  test('age 6 days → +0 from age (threshold is 7)', () => {
    const r = scoreCase({ ...base, applicationDate: daysAgo(6) })
    expect(r.score).toBe(0)
  })

  test('age 7 days → +5 from age', () => {
    const r = scoreCase({ ...base, applicationDate: daysAgo(7) })
    expect(r.score).toBe(5)
  })

  test('age 14 days → +5 from age (not yet ≥15)', () => {
    const r = scoreCase({ ...base, applicationDate: daysAgo(14) })
    expect(r.score).toBe(5)
  })

  test('age 15 days → +10 from age', () => {
    const r = scoreCase({ ...base, applicationDate: daysAgo(15) })
    expect(r.score).toBe(10)
  })

  test('age 19 days → +10 from age (not yet ≥20)', () => {
    const r = scoreCase({ ...base, applicationDate: daysAgo(19) })
    expect(r.score).toBe(10)
  })

  test('age 20 days → +20 from age', () => {
    const r = scoreCase({ ...base, applicationDate: daysAgo(20) })
    expect(r.score).toBe(20)
  })

  test('age 24 days → +20 from age (not yet ≥25)', () => {
    const r = scoreCase({ ...base, applicationDate: daysAgo(24) })
    expect(r.score).toBe(20)
  })

  test('age 25 days → +30 from age (critical zone)', () => {
    const r = scoreCase({ ...base, applicationDate: daysAgo(25) })
    expect(r.score).toBe(30)
  })

  test('age 30 days → +30 from age', () => {
    const r = scoreCase({ ...base, applicationDate: daysAgo(30) })
    expect(r.score).toBe(30)
  })

  test('age 25+ days: factors mention critical deadline', () => {
    const r = scoreCase({ ...base, applicationDate: daysAgo(27) })
    expect(r.factors.some(f => f.toLowerCase().includes('critical'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 3. VULNERABLE POPULATION FLAGS
// ---------------------------------------------------------------------------

describe('Vulnerable population scoring', () => {
  test('homeless → +15', () => {
    const r = scoreCase({ ...base, isHomeless: true })
    expect(r.score).toBe(15)
  })

  test('migrant worker → +12', () => {
    const r = scoreCase({ ...base, isMigrantWorker: true })
    expect(r.score).toBe(12)
  })

  test('disabled member → +10', () => {
    const r = scoreCase({ ...base, hasDisabled: true })
    expect(r.score).toBe(10)
  })

  test('elderly member → +8', () => {
    const r = scoreCase({ ...base, hasElderly: true })
    expect(r.score).toBe(8)
  })

  test('has minors → +8', () => {
    const r = scoreCase({ ...base, hasMinors: true })
    expect(r.score).toBe(8)
  })

  test('homeless + migrant + disabled + elderly + minors → stacked flags', () => {
    const r = scoreCase({
      ...base,
      isHomeless: true,     // +15
      isMigrantWorker: true, // +12
      hasDisabled: true,    // +10
      hasElderly: true,     // +8
      hasMinors: true,      // +8
    })
    // 15+12+10+8+8 = 53 (income=1000 so no income bonus, assets=500 no destitution)
    expect(r.score).toBe(53)
  })
})

// ---------------------------------------------------------------------------
// 4. HOUSEHOLD SIZE
// ---------------------------------------------------------------------------

describe('Large household bonus', () => {
  test('HH4 → no bonus (threshold is 5)', () => {
    const r = scoreCase({ ...base, householdSize: 4 })
    expect(r.score).toBe(0)
  })

  test('HH5 → +5', () => {
    const r = scoreCase({ ...base, householdSize: 5 })
    expect(r.score).toBe(5)
  })

  test('HH10 → +5 (same bonus regardless of size above 5)', () => {
    const r = scoreCase({ ...base, householdSize: 10 })
    expect(r.score).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// 5. INCOME FLAGS
// ---------------------------------------------------------------------------

describe('Income-based scoring', () => {
  test('zero income → +10', () => {
    const r = scoreCase({ ...base, monthlyGrossIncome: 0, assets: 500 })
    expect(r.score).toBe(10)
  })

  test('income $1 → still > 0, not zero bonus, but < $300 → +5', () => {
    const r = scoreCase({ ...base, monthlyGrossIncome: 1 })
    expect(r.score).toBe(5)
  })

  test('income $299 → +5 (very low income)', () => {
    const r = scoreCase({ ...base, monthlyGrossIncome: 299 })
    expect(r.score).toBe(5)
  })

  test('income $300 → +0 (threshold is strictly < $300)', () => {
    const r = scoreCase({ ...base, monthlyGrossIncome: 300 })
    expect(r.score).toBe(0)
  })

  test('income $1,000 → +0', () => {
    const r = scoreCase({ ...base, monthlyGrossIncome: 1000 })
    expect(r.score).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 6. DESTITUTION FLAG (assets < $100 AND income < $500)
// ---------------------------------------------------------------------------

describe('Destitution flag', () => {
  test('assets=$99, income=$499 → +8 destitution bonus', () => {
    const r = scoreCase({ ...base, assets: 99, monthlyGrossIncome: 499 })
    // income < 300 → +5; destitution → +8; total = 13
    expect(r.score).toBe(13)
  })

  test('assets=$100 (not < 100) → no destitution bonus', () => {
    const r = scoreCase({ ...base, assets: 100, monthlyGrossIncome: 400 })
    // income < 300? No (400 ≥ 300). Destitution? assets=100 not < 100
    expect(r.score).toBe(0)
  })

  test('assets=$50, income=$500 (not < 500) → no destitution bonus', () => {
    const r = scoreCase({ ...base, assets: 50, monthlyGrossIncome: 500 })
    // income: 500 ≥ 300, not zero; destitution: income not < 500
    expect(r.score).toBe(0)
  })

  test('assets=$0, income=$0 → zero income bonus (+10) + destitution bonus (+8) = 18', () => {
    const r = scoreCase({ ...base, assets: 0, monthlyGrossIncome: 0 })
    expect(r.score).toBe(18)
  })
})

// ---------------------------------------------------------------------------
// 7. SCORE CAP
// ---------------------------------------------------------------------------

describe('Score cap at 100', () => {
  test('worst-case scenario never exceeds 100', () => {
    const r = scoreCase({
      applicationDate: daysAgo(30),   // +30
      isHomeless: true,               // +15
      isMigrantWorker: true,          // +12
      hasDisabled: true,              // +10
      hasElderly: true,               // +8
      hasMinors: true,                // +8
      householdSize: 6,               // +5
      monthlyGrossIncome: 0,          // +10
      assets: 0,                      // +8 destitution
      expeditedEligible: true,        // +50
      status: 'PENDING_REVIEW',
    })
    // raw = 30+15+12+10+8+8+5+10+8+50 = 156 → capped at 100
    expect(r.score).toBe(100)
    expect(r.score).toBeLessThanOrEqual(100)
  })
})

// ---------------------------------------------------------------------------
// 8. PRIORITY TIERS (non-expedited)
// ---------------------------------------------------------------------------

describe('Priority tier thresholds', () => {
  test('score < 40 → LOW priority', () => {
    // Fresh case, no flags, normal income — score = 0
    const r = scoreCase({ ...base })
    expect(r.score).toBe(0)
    expect(r.priority).toBe('LOW')
  })

  test('score 40 → NORMAL priority', () => {
    // Homeless (+15) + migrant (+12) + disabled (+10) + 3 days old (0) = 37 — not 40 yet
    // Homeless (+15) + migrant (+12) + disabled (+10) + elderly (+8) = 45 → NORMAL
    const r = scoreCase({ ...base, isHomeless: true, isMigrantWorker: true, hasDisabled: true, hasElderly: true })
    expect(r.score).toBe(45)
    expect(r.priority).toBe('NORMAL')
  })

  test('score 70 → HIGH priority', () => {
    // age 25 (+30) + homeless (+15) + migrant (+12) + disabled (+10) + elderly (+8) = 75 → HIGH
    const r = scoreCase({
      ...base,
      applicationDate: daysAgo(25),
      isHomeless: true,
      isMigrantWorker: true,
      hasDisabled: true,
      hasElderly: true,
    })
    expect(r.score).toBe(75)
    expect(r.priority).toBe('HIGH')
  })

  test('EXPEDITED priority always set when expeditedEligible=true, regardless of score', () => {
    // Fresh case (score base 0) but expedited
    const r = scoreCase({ ...base, expeditedEligible: true })
    expect(r.priority).toBe('EXPEDITED')
  })
})

// ---------------------------------------------------------------------------
// 9. DUE DATE CALCULATION
// ---------------------------------------------------------------------------

describe('Due date calculation', () => {
  test('standard case: due date = application date + 30 days', () => {
    const appDate = daysAgo(5)
    const r = scoreCase({ ...base, applicationDate: appDate })
    const expected = new Date(appDate)
    expected.setDate(expected.getDate() + 30)
    expect(r.dueDate.toDateString()).toBe(expected.toDateString())
  })

  test('expedited case: due date = application date + 7 days', () => {
    const appDate = daysAgo(2)
    const r = scoreCase({ ...base, applicationDate: appDate, expeditedEligible: true })
    const expected = new Date(appDate)
    expected.setDate(expected.getDate() + 7)
    expect(r.dueDate.toDateString()).toBe(expected.toDateString())
  })
})

// ---------------------------------------------------------------------------
// 10. RANK CASES
// ---------------------------------------------------------------------------

describe('rankCases', () => {
  test('higher-scored cases sort first', () => {
    const cases = [
      { id: 'A', priorityScore: 10, applicationDate: daysAgo(5) },
      { id: 'B', priorityScore: 80, applicationDate: daysAgo(5) },
      { id: 'C', priorityScore: 40, applicationDate: daysAgo(5) },
    ]
    const ranked = rankCases(cases)
    expect(ranked.map(c => c.id)).toEqual(['B', 'C', 'A'])
  })

  test('tiebreak: older application date wins when scores are equal', () => {
    const cases = [
      { id: 'newer', priorityScore: 50, applicationDate: daysAgo(5) },
      { id: 'older', priorityScore: 50, applicationDate: daysAgo(20) },
    ]
    const ranked = rankCases(cases)
    expect(ranked[0].id).toBe('older')
  })

  test('missing priorityScore treated as 0', () => {
    const cases = [
      { id: 'no-score', applicationDate: daysAgo(1) },
      { id: 'has-score', priorityScore: 30, applicationDate: daysAgo(1) },
    ]
    const ranked = rankCases(cases)
    expect(ranked[0].id).toBe('has-score')
  })

  test('does not mutate the original array', () => {
    const cases = [
      { id: 'A', priorityScore: 10, applicationDate: daysAgo(1) },
      { id: 'B', priorityScore: 90, applicationDate: daysAgo(1) },
    ]
    const original = [...cases]
    rankCases(cases)
    expect(cases[0].id).toBe(original[0].id)
  })

  test('empty array returns empty array', () => {
    expect(rankCases([])).toEqual([])
  })

  test('single-item array returns the same item', () => {
    const c = [{ id: 'only', priorityScore: 42, applicationDate: daysAgo(1) }]
    expect(rankCases(c)).toHaveLength(1)
  })
})
