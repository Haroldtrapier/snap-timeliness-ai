import { NextResponse } from "next/server";
import { isServiceConfigured, createSupabaseServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Days-before-due at which SNAP AI sends a deadline reminder.
const THRESHOLDS = [90, 60, 30, 14, 3, 1, 0];
const DAY_MS = 1000 * 60 * 60 * 24;

// Daily reminders job (wired via vercel.json crons). For each unresolved
// deadline falling on a reminder threshold, record a reminder. Delivery is a
// no-op stub today (the reminder row is the in-app reminder); the integration
// point below is where an email/SMS provider would send and set sent_at.
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
    .select("id, due_at")
    .is("resolved_at", null)
    .gte("due_at", new Date(now).toISOString())
    .lte("due_at", horizon);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  let created = 0;
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

    const { error: insErr } = await supabase.from("reminders").insert({
      deadline_id: d.id,
      scheduled_for: new Date(now).toISOString(),
      channel: "inapp",
      // Delivery stub: a real email/SMS integration would send first and set
      // sent_at only on success. For now the in-app reminder is "delivered".
      sent_at: new Date(now).toISOString(),
    });
    if (!insErr) created += 1;
  }

  return NextResponse.json({ ok: true, scanned: deadlines?.length ?? 0, created });
}
