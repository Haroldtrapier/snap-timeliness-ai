// Transactional email for deadline reminders. OPTIONAL, like Supabase and
// Anthropic: when RESEND_API_KEY + REMINDERS_FROM_EMAIL are set the cron sends
// real email; when unset the cron records in-app reminders only. Uses the
// Resend REST API directly via fetch — no SDK dependency.

export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
export const REMINDERS_FROM_EMAIL = process.env.REMINDERS_FROM_EMAIL ?? "";

export const isEmailConfigured = Boolean(RESEND_API_KEY && REMINDERS_FROM_EMAIL);

export interface ReminderEmail {
  to: string;
  name: string | null;
  what: string;
  dueAt: Date;
  daysBefore: number;
}

// ---- Pure formatting helpers (unit-tested) --------------------------------

/** Human phrase for how far out a deadline is. */
export function duePhrase(daysBefore: number): string {
  if (daysBefore <= 0) return "due today";
  if (daysBefore === 1) return "due tomorrow";
  return `due in ${daysBefore} days`;
}

export function reminderSubject(daysBefore: number, what: string): string {
  return `Reminder: ${what} is ${duePhrase(daysBefore)}`;
}

function formatDate(due: Date): string {
  return due.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain-text + HTML bodies for a reminder. Calm, plain-language, no PII beyond
 *  the recipient's own name and their own deadline. */
export function reminderBody(email: ReminderEmail): { text: string; html: string } {
  const greeting = email.name ? `Hi ${email.name},` : "Hi,";
  const when = `${formatDate(email.dueAt)} (${duePhrase(email.daysBefore)})`;
  const text = [
    greeting,
    "",
    `This is a reminder from SNAP AI about an upcoming deadline for your SNAP case:`,
    "",
    `  ${email.what}`,
    `  ${when}`,
    "",
    "Sign in to SNAP AI to see details and what to do next.",
    "",
    "This is a reminder only. Final eligibility decisions are made by your state SNAP agency.",
  ].join("\n");

  const html = [
    `<p>${escapeHtml(greeting)}</p>`,
    `<p>This is a reminder from <strong>SNAP AI</strong> about an upcoming deadline for your SNAP case:</p>`,
    `<p style="margin:16px 0;padding:12px 16px;border-left:3px solid #2563eb;background:#f8fafc">`,
    `<strong>${escapeHtml(email.what)}</strong><br>${escapeHtml(when)}</p>`,
    `<p>Sign in to SNAP AI to see details and what to do next.</p>`,
    `<p style="color:#64748b;font-size:13px">This is a reminder only. Final eligibility decisions are made by your state SNAP agency.</p>`,
  ].join("");

  return { text, html };
}

// ---- Delivery -------------------------------------------------------------

/**
 * Send a reminder email via Resend. Returns true only on a 2xx response, so the
 * caller can set `sent_at` only on real delivery. Never throws — network/API
 * failures resolve to false.
 */
export async function sendReminderEmail(email: ReminderEmail): Promise<boolean> {
  if (!isEmailConfigured) return false;
  try {
    const { text, html } = reminderBody(email);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REMINDERS_FROM_EMAIL,
        to: email.to,
        subject: reminderSubject(email.daysBefore, email.what),
        text,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
