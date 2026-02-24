/**
 * Database seed — creates demo users and sample cases for development.
 */

import bcrypt from 'bcryptjs'
import 'dotenv/config'
import prisma from './config/database'
import { determineEligibility } from './services/eligibilityEngine'
import { scoreCase } from './services/casePrioritizer'
import { encrypt } from './services/encryption'

const WORKERS = [
  { email: 'admin@cumberland.nc.gov', firstName: 'Admin', lastName: 'User', role: 'ADMIN' as const },
  { email: 'supervisor@cumberland.nc.gov', firstName: 'Maria', lastName: 'Johnson', role: 'SUPERVISOR' as const },
  { email: 'worker1@cumberland.nc.gov', firstName: 'James', lastName: 'Williams', role: 'ELIGIBILITY_WORKER' as const },
  { email: 'worker2@cumberland.nc.gov', firstName: 'Sarah', lastName: 'Davis', role: 'ELIGIBILITY_WORKER' as const },
  { email: 'worker3@cumberland.nc.gov', firstName: 'Robert', lastName: 'Garcia', role: 'ELIGIBILITY_WORKER' as const },
]

const SAMPLE_CASES = [
  {
    applicantFirstName: 'Angela',
    applicantLastName: 'Thompson',
    householdSize: 3,
    monthlyGrossIncome: 1800,
    monthlyEarnedIncome: 1800,
    assets: 300,
    hasElderly: false, hasDisabled: false, isHomeless: false, isMigrantWorker: false, hasMinors: true,
    daysAgo: 28,
  },
  {
    applicantFirstName: 'Marcus',
    applicantLastName: 'Lee',
    householdSize: 1,
    monthlyGrossIncome: 0,
    monthlyEarnedIncome: 0,
    assets: 50,
    hasElderly: false, hasDisabled: false, isHomeless: true, isMigrantWorker: false, hasMinors: false,
    daysAgo: 3,
  },
  {
    applicantFirstName: 'Rosa',
    applicantLastName: 'Martinez',
    householdSize: 5,
    monthlyGrossIncome: 2800,
    monthlyEarnedIncome: 2800,
    assets: 1200,
    hasElderly: false, hasDisabled: false, isHomeless: false, isMigrantWorker: true, hasMinors: true,
    daysAgo: 6,
  },
  {
    applicantFirstName: 'Dorothy',
    applicantLastName: 'Wilson',
    householdSize: 2,
    monthlyGrossIncome: 1200,
    monthlyEarnedIncome: 800,
    assets: 2100,
    hasElderly: true, hasDisabled: false, isHomeless: false, isMigrantWorker: false, hasMinors: false,
    daysAgo: 15,
  },
  {
    applicantFirstName: 'Kevin',
    applicantLastName: 'Brown',
    householdSize: 4,
    monthlyGrossIncome: 4200,
    monthlyEarnedIncome: 4200,
    assets: 5000,
    hasElderly: false, hasDisabled: false, isHomeless: false, isMigrantWorker: false, hasMinors: true,
    daysAgo: 10,
  },
]

// Guard: fail early with a clear message if required env vars are missing
const key = process.env.ENCRYPTION_KEY
if (!key || Buffer.from(key, 'hex').length !== 32) {
  console.error(
    '\n[seed] ERROR: ENCRYPTION_KEY is missing or invalid.\n' +
    '  Generate a key with:\n' +
    "    node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"\n" +
    '  Then add it to your .env file as ENCRYPTION_KEY=<64-hex-chars>\n',
  )
  process.exit(1)
}

async function seed() {
  console.log('Seeding database...')
  const passwordHash = await bcrypt.hash('Password123!', 12)

  // Create users
  for (const w of WORKERS) {
    await prisma.user.upsert({
      where: { email: w.email },
      update: {},
      create: { ...w, passwordHash, county: 'Cumberland' },
    })
  }
  console.log(`Created ${WORKERS.length} users`)

  // Create sample cases
  let created = 0
  for (const c of SAMPLE_CASES) {
    const applicationDate = new Date(Date.now() - c.daysAgo * 24 * 60 * 60 * 1000)
    const eligibility = determineEligibility({ ...c, categoricalEligible: false })
    const priorityScore = scoreCase({ ...c, applicationDate, expeditedEligible: eligibility.expeditedEligible, status: 'PENDING_REVIEW' })

    await prisma.snapCase.create({
      data: {
        caseNumber: `SNAP-2026-${100000 + created}`,
        applicantFirstName: c.applicantFirstName,
        applicantLastName: c.applicantLastName,
        applicantDob: new Date('1985-01-01'),
        applicantSsn: encrypt('000-00-0001'),
        address: '123 Main St',
        city: 'Fayetteville',
        state: 'NC',
        zipCode: '28301',
        householdSize: c.householdSize,
        monthlyGrossIncome: c.monthlyGrossIncome,
        monthlyNetIncome: c.monthlyGrossIncome * 0.8,
        assets: c.assets,
        hasElderly: c.hasElderly,
        hasDisabled: c.hasDisabled,
        isHomeless: c.isHomeless,
        isMigrantWorker: c.isMigrantWorker,
        priority: priorityScore.priority,
        dueDate: priorityScore.dueDate,
        applicationDate,
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
            categoricalEligible: false,
            expeditedEligible: eligibility.expeditedEligible,
            result: eligibility.result as 'ELIGIBLE' | 'INELIGIBLE' | 'EXPEDITED_ELIGIBLE' | 'PENDING_VERIFICATION' | 'NEEDS_REVIEW',
            estimatedMonthlyBenefit: eligibility.estimatedMonthlyBenefit,
            maxAllotment: eligibility.maxAllotment,
            netIncomeDeductions: eligibility.deductions as unknown as import('@prisma/client').Prisma.InputJsonValue,
            povertyLevel: eligibility.povertyLevel,
            checkedBy: 'AI',
          },
        },
      },
    })
    created++
  }
  console.log(`Created ${created} sample cases`)
  console.log('\nDemo credentials:')
  WORKERS.forEach(w => console.log(`  ${w.role}: ${w.email} / Password123!`))
}

seed()
  .then(() => { console.log('\nSeed complete!'); process.exit(0) })
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
