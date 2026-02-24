/**
 * emailService tests
 *
 * nodemailer is mocked so no real SMTP connection is made.
 * We verify that each function calls sendMail with the right shape:
 * correct `to`, expected keywords in `subject`, and an HTML body.
 */

// ---------------------------------------------------------------------------
// Mock nodemailer before importing the module under test
// ---------------------------------------------------------------------------

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' })

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}))

import {
  sendDeadlineAlert,
  sendSupervisorDailySummary,
  sendPasswordResetEmail,
} from '../emailService'

// ---------------------------------------------------------------------------

beforeEach(() => {
  mockSendMail.mockClear()
})

// ---------------------------------------------------------------------------
// sendDeadlineAlert
// ---------------------------------------------------------------------------

describe('sendDeadlineAlert', () => {
  const base = {
    workerEmail: 'worker@cumberland.nc.gov',
    workerName: 'James Williams',
    caseNumber: 'SNAP-2026-100001',
    applicantName: 'Jane Doe',
    dueDate: new Date('2026-03-01'),
    isExpedited: false,
    caseUrl: 'http://localhost:3000/cases/abc',
  }

  it('sends to the worker email address', async () => {
    await sendDeadlineAlert({ ...base, daysRemaining: 5 })
    expect(mockSendMail).toHaveBeenCalledTimes(1)
    expect(mockSendMail.mock.calls[0][0].to).toBe('worker@cumberland.nc.gov')
  })

  it('subject contains case number', async () => {
    await sendDeadlineAlert({ ...base, daysRemaining: 5 })
    expect(mockSendMail.mock.calls[0][0].subject).toContain('SNAP-2026-100001')
  })

  it('subject says OVERDUE when daysRemaining <= 0', async () => {
    await sendDeadlineAlert({ ...base, daysRemaining: 0 })
    expect(mockSendMail.mock.calls[0][0].subject).toMatch(/OVERDUE/i)
  })

  it('subject contains days remaining when positive', async () => {
    await sendDeadlineAlert({ ...base, daysRemaining: 3 })
    expect(mockSendMail.mock.calls[0][0].subject).toContain('3 DAYS REMAINING')
  })

  it('subject flags EXPEDITED when isExpedited=true', async () => {
    await sendDeadlineAlert({ ...base, daysRemaining: 2, isExpedited: true })
    expect(mockSendMail.mock.calls[0][0].subject).toMatch(/EXPEDITED/i)
  })

  it('html body contains applicant name', async () => {
    await sendDeadlineAlert({ ...base, daysRemaining: 5 })
    expect(mockSendMail.mock.calls[0][0].html).toContain('Jane Doe')
  })

  it('html body contains case URL link', async () => {
    await sendDeadlineAlert({ ...base, daysRemaining: 5 })
    expect(mockSendMail.mock.calls[0][0].html).toContain('http://localhost:3000/cases/abc')
  })
})

// ---------------------------------------------------------------------------
// sendSupervisorDailySummary
// ---------------------------------------------------------------------------

describe('sendSupervisorDailySummary', () => {
  const base = {
    supervisorEmail: 'super@cumberland.nc.gov',
    supervisorName: 'Maria Johnson',
    overdueCount: 0,
    dueTodayCount: 2,
    dueTomorrowCount: 3,
    totalPendingCount: 10,
    appUrl: 'http://localhost:3000',
  }

  it('sends to the supervisor email', async () => {
    await sendSupervisorDailySummary(base)
    expect(mockSendMail.mock.calls[0][0].to).toBe('super@cumberland.nc.gov')
  })

  it('subject highlights ACTION REQUIRED when there are overdue cases', async () => {
    await sendSupervisorDailySummary({ ...base, overdueCount: 2 })
    expect(mockSendMail.mock.calls[0][0].subject).toMatch(/ACTION REQUIRED/i)
  })

  it('subject mentions due today count when nothing overdue', async () => {
    await sendSupervisorDailySummary(base)
    expect(mockSendMail.mock.calls[0][0].subject).toContain('2 cases due today')
  })

  it('html body contains supervisor name', async () => {
    await sendSupervisorDailySummary(base)
    expect(mockSendMail.mock.calls[0][0].html).toContain('Maria Johnson')
  })
})

// ---------------------------------------------------------------------------
// sendPasswordResetEmail
// ---------------------------------------------------------------------------

describe('sendPasswordResetEmail', () => {
  const payload = {
    to: 'user@cumberland.nc.gov',
    name: 'Sarah Davis',
    resetUrl: 'http://localhost:3000/reset-password?token=abc123',
    expiresInMinutes: 60,
  }

  it('sends to the correct address', async () => {
    await sendPasswordResetEmail(payload)
    expect(mockSendMail.mock.calls[0][0].to).toBe('user@cumberland.nc.gov')
  })

  it('subject contains password reset language', async () => {
    await sendPasswordResetEmail(payload)
    expect(mockSendMail.mock.calls[0][0].subject).toMatch(/password reset/i)
  })

  it('html body contains the reset URL', async () => {
    await sendPasswordResetEmail(payload)
    expect(mockSendMail.mock.calls[0][0].html).toContain(
      'http://localhost:3000/reset-password?token=abc123',
    )
  })

  it('html body contains the expiry time', async () => {
    await sendPasswordResetEmail(payload)
    expect(mockSendMail.mock.calls[0][0].html).toContain('60')
  })

  it('html body greets the recipient by name', async () => {
    await sendPasswordResetEmail(payload)
    expect(mockSendMail.mock.calls[0][0].html).toContain('Sarah Davis')
  })
})
