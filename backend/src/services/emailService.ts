import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: parseInt(process.env.SMTP_PORT ?? '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
})

const FROM = process.env.EMAIL_FROM ?? 'SNAP-AI <no-reply@cumberland-dss.nc.gov>'

export interface DeadlineAlertPayload {
  workerEmail: string
  workerName: string
  caseNumber: string
  applicantName: string
  dueDate: Date
  daysRemaining: number
  isExpedited: boolean
  caseUrl: string
}

export async function sendDeadlineAlert(p: DeadlineAlertPayload): Promise<void> {
  const urgencyLabel = p.daysRemaining <= 0
    ? 'OVERDUE'
    : p.daysRemaining === 1
      ? '1 DAY REMAINING'
      : `${p.daysRemaining} DAYS REMAINING`

  const subject = p.daysRemaining <= 0
    ? `[OVERDUE] ${p.isExpedited ? '[EXPEDITED] ' : ''}Case ${p.caseNumber} — Action Required`
    : `[${urgencyLabel}] ${p.isExpedited ? '[EXPEDITED] ' : ''}Case ${p.caseNumber} Deadline Approaching`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${p.daysRemaining <= 0 ? '#dc2626' : p.isExpedited ? '#d97706' : '#2563eb'}; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 18px;">
          ${p.daysRemaining <= 0 ? 'OVERDUE — Immediate Action Required' : `Case Deadline: ${urgencyLabel}`}
        </h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; margin-top: 0;">Hi ${p.workerName},</p>
        <p style="color: #374151;">
          ${p.daysRemaining <= 0
            ? 'The following SNAP case is <strong>overdue</strong> and requires immediate action to comply with federal processing requirements.'
            : `The following SNAP case is due in <strong>${p.daysRemaining} day${p.daysRemaining !== 1 ? 's' : ''}</strong>.`
          }
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: white; border: 1px solid #e5e7eb;">
            <td style="padding: 10px 14px; color: #6b7280; width: 140px;">Case Number</td>
            <td style="padding: 10px 14px; font-weight: 600; color: #111827;">${p.caseNumber}</td>
          </tr>
          <tr style="background: #f9fafb; border: 1px solid #e5e7eb;">
            <td style="padding: 10px 14px; color: #6b7280;">Applicant</td>
            <td style="padding: 10px 14px; font-weight: 600; color: #111827;">${p.applicantName}</td>
          </tr>
          <tr style="background: white; border: 1px solid #e5e7eb;">
            <td style="padding: 10px 14px; color: #6b7280;">Due Date</td>
            <td style="padding: 10px 14px; font-weight: 600; color: ${p.daysRemaining <= 0 ? '#dc2626' : '#111827'};">
              ${p.dueDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </td>
          </tr>
          ${p.isExpedited ? `
          <tr style="background: #fef3c7; border: 1px solid #e5e7eb;">
            <td style="padding: 10px 14px; color: #92400e;">Priority</td>
            <td style="padding: 10px 14px; font-weight: 600; color: #92400e;">⚡ EXPEDITED (7-day deadline)</td>
          </tr>` : ''}
        </table>

        <a href="${p.caseUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 8px 0;">
          Open Case in SNAP-AI →
        </a>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          Cumberland County DSS — SNAP-AI Case Management System<br />
          Federal processing deadlines: 30 days standard, 7 days expedited (7 CFR § 273.2)
        </p>
      </div>
    </div>
  `

  await transporter.sendMail({ from: FROM, to: p.workerEmail, subject, html })
}

export interface SupervisorSummaryPayload {
  supervisorEmail: string
  supervisorName: string
  overdueCount: number
  dueTodayCount: number
  dueTomorrowCount: number
  totalPendingCount: number
  appUrl: string
}

export async function sendSupervisorDailySummary(p: SupervisorSummaryPayload): Promise<void> {
  const subject = p.overdueCount > 0
    ? `[ACTION REQUIRED] ${p.overdueCount} overdue SNAP cases — Daily Summary`
    : `SNAP-AI Daily Summary — ${p.dueTodayCount} cases due today`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e3a5f; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 18px;">SNAP-AI Daily Case Summary</h1>
        <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 14px;">
          ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; margin-top: 0;">Good morning, ${p.supervisorName}.</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0;">
          <div style="background: ${p.overdueCount > 0 ? '#fef2f2' : 'white'}; border: 1px solid ${p.overdueCount > 0 ? '#fecaca' : '#e5e7eb'}; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: ${p.overdueCount > 0 ? '#dc2626' : '#6b7280'};">${p.overdueCount}</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">Overdue</div>
          </div>
          <div style="background: ${p.dueTodayCount > 0 ? '#fffbeb' : 'white'}; border: 1px solid ${p.dueTodayCount > 0 ? '#fde68a' : '#e5e7eb'}; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: ${p.dueTodayCount > 0 ? '#d97706' : '#6b7280'};">${p.dueTodayCount}</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">Due Today</div>
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: #374151;">${p.dueTomorrowCount}</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">Due Tomorrow</div>
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: #374151;">${p.totalPendingCount}</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">Total Pending</div>
          </div>
        </div>

        <a href="${p.appUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 8px 0;">
          Open SNAP-AI Dashboard →
        </a>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          Cumberland County DSS — SNAP-AI Case Management System<br />
          You are receiving this because you are a supervisor. Reply to unsubscribe.
        </p>
      </div>
    </div>
  `

  await transporter.sendMail({ from: FROM, to: p.supervisorEmail, subject, html })
}

export interface PasswordResetPayload {
  to: string
  name: string
  resetUrl: string
  expiresInMinutes: number
}

export async function sendPasswordResetEmail(p: PasswordResetPayload): Promise<void> {
  const subject = 'SNAP-AI — Password Reset Request'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #16a34a; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 18px;">Password Reset Request</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; margin-top: 0;">Hi ${p.name},</p>
        <p style="color: #374151;">
          We received a request to reset the password for your SNAP-AI account.
          Click the button below to choose a new password.
          This link will expire in <strong>${p.expiresInMinutes} minutes</strong>.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${p.resetUrl}"
             style="display: inline-block; background: #16a34a; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Reset My Password →
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">
          If you didn't request a password reset, you can safely ignore this email. Your password will not change.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          Cumberland County DSS — SNAP-AI Case Management System<br/>
          This is an automated message — do not reply.
        </p>
      </div>
    </div>
  `

  await transporter.sendMail({ from: FROM, to: p.to, subject, html })
}
