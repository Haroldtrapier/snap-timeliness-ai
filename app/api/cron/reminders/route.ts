import { NextResponse } from "next/server";
import { isServiceConfigured, createSupabaseServiceClient } from "@/lib/supabase/admin";
import { isEmailConfigured, sendReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Days-before-due at which SNAP AI sends a deadline reminder.
const THRESHOLDS = [90, 60, 30, 14, 3, 1, 0];
const DAY_MS = 1000 * 60 * 60 * 24;

type ClientRel = { full_name: string | null; owner_user_id: string | null };

function relValue<T>(rel: T | T[] | null | undefined): T | null {
  return Array.isArray(rel) ? (rel[0] ?? null) : (rel ?? null);
}

// Daily reminders job (wired via vercel.json crons). For each unresolved
// deadline falling on a reminder threshold, record a reminder and — when email
// is configured (RESEND_API_KEY + REMINDERS_FROM_EMAIL) and we can resolve the
// applicant's email — send it. `sent_at` is set only on successful delivery;
// in-app reminders (no email configured / no address) count as delivered on
// insert. Without email configured the behavior is unchanged from before.
export async function GET(request: Request) {
  // Vercel Cron includes `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isServiceConfigured) {
    return NextResponse.json({ skipped: "SUPABASE_SERVICE_ROLE_KEY not configured" });
  }

  const supabase = createSupabaseServiceClient();

  const now = Date.now();
  const horizon = new Date(now + 91 * DAY_MS).toISOString();
  const { data: deadlines, error } = await supabase
    .from("deadlines")
    .select("id, due_at, type, description, client_id, clients(full_name, owner_user_id)")
    .is("resolved_at", null)
    .gte("due_at", new Date(now).toISOString())
    .lte("due_at", horizon);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  // Resolve applicant emails in one batch (service role bypasses RLS).
  const ownerIds = [
    ...new Set(
      (deadlines ?? [])
        .map((d) => relValue<ClientRel>(d.clients)?.owner_user_id)
        .filter((v): v is string => Boolean(v)),
    ),
  ];
  const emailByUser = new Map<string, string>();
  if (isEmailConfigured && ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", ownerIds);
    (profiles ?? []).forEach((p) => {
      if (p.email) emailByUser.set(p.id, p.email);
    });
  }

  let created = 0;
  let emailed = 0;
  for (const d of deadlines ?? []) {
    const days = Math.ceil((new Date(d.due_at).getTime() - now) / DAY_MS);
    if (!THRESHOLDS.includes(days)) continue;

    // Dedupe: at most one reminder per deadline per day (the cron runs daily).
    const { count } = await supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("deadline_id", d.id)
      .gte("scheduled_for", startOfDay.toISOString());
    if ((count ?? 0) > 0) continue;

    const client = relValue<ClientRel>(d.clients);
    const to = client?.owner_user_id ? emailByUser.get(client.owner_user_id) : undefined;
    const what = d.description || d.type || "an upcoming SNAP deadline";

    // Try email first when we have an address; the in-app row always records.
    let channel: "inapp" | "email" = "inapp";
    let delivered = true; // in-app reminders are "delivered" on insert
    if (isEmailConfigured && to) {
      channel = "email";
      delivered = await sendReminderEmail({
        to,
        name: client?.full_name ?? null,
        what,
        dueAt: new Date(d.due_at),
        daysBefore: days,
      });
    }

    const { error: insErr } = await supabase.from("reminders").insert({
      deadline_id: d.id,
      scheduled_for: new Date(now).toISOString(),
      channel,
      // Set only on real delivery: a failed email leaves sent_at null so it is
      // visibly un-sent (a follow-up run can pick it up once the threshold or
      // day changes). In-app reminders are delivered immediately.
      sent_at: delivered ? new Date(now).toISOString() : null,
    });
    if (!insErr) {
      created += 1;
      if (channel === "email" && delivered) emailed += 1;
    }
  }

  return NextResponse.json({ ok: true, scanned: deadlines?.length ?? 0, created, emailed });
}
