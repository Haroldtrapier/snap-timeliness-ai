import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/db/profiles";
import { getOwnedClient, getOrCreateActiveCase } from "@/lib/db/cases";
import { getOrCreateChecklist } from "@/lib/db/checklist";
import { listDeadlines } from "@/lib/db/deadlines";
import { listNotices } from "@/lib/db/notices";
import { daysUntil, formatDate, urgencyForDays } from "@/lib/utils";
import { Disclaimer } from "@/components/Disclaimer";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (!profile?.state) redirect("/onboarding");

  const client = await getOwnedClient();
  if (!client) redirect("/onboarding");

  // Ensure there's an active case + checklist so a fresh applicant lands on a populated dashboard.
  const snapCase = await getOrCreateActiveCase({ clientId: client.id });
  const { items } = await getOrCreateChecklist(snapCase.id);
  const [deadlines, notices] = await Promise.all([
    listDeadlines(client.id),
    listNotices(client.id),
  ]);

  const requiredOpen = items.filter((c) => c.required && c.status === "open");
  const requiredTotal = items.filter((c) => c.required).length;
  const score =
    requiredTotal === 0
      ? 0
      : Math.round(((requiredTotal - requiredOpen.length) / requiredTotal) * 100);

  const upcoming = deadlines.filter((d) => !d.resolved_at).slice(0, 4);
  const firstName = (profile.full_name ?? user.email ?? "there").split(" ")[0];

  const suggested = requiredOpen[0]
    ? `Upload your ${requiredOpen[0].label.toLowerCase()} to keep your application moving.`
    : upcoming[0]
    ? `Prepare for: ${upcoming[0].description ?? upcoming[0].type}.`
    : "Confirm your interview is on your calendar and review your checklist.";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
        <p className="text-sm text-gray-600">
          You are <span className="font-medium">{snapCase.stage.replace("_", " ")}</span> in {profile.county} County,{" "}
          {profile.state}.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card card-pad">
          <div className="text-xs text-gray-500">SNAP readiness score</div>
          <div className="mt-1 text-3xl font-bold text-brand-700">{score}%</div>
          <div className="mt-2 h-2 w-full rounded bg-gray-100">
            <div className="h-2 rounded bg-brand-500" style={{ width: `${score}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-500">Guidance only — not an eligibility determination.</p>
        </div>
        <div className="card card-pad">
          <div className="text-xs text-gray-500">Missing required documents</div>
          <div className="mt-1 text-3xl font-bold text-amber-700">{requiredOpen.length}</div>
          <Link href="/application-checklist" className="mt-2 inline-block text-sm text-brand-700">
            Open checklist →
          </Link>
        </div>
        <div className="card card-pad">
          <div className="text-xs text-gray-500">Suggested next step</div>
          <div className="mt-1 text-sm text-gray-900">{suggested}</div>
        </div>
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card card-pad">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Upcoming deadlines</h2>
            <Link href="/deadlines" className="text-sm text-brand-700">
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">No upcoming deadlines. Add one when you get a notice.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((d) => {
                const days = daysUntil(d.due_at);
                const u = urgencyForDays(days);
                return (
                  <li
                    key={d.id}
                    className="flex justify-between items-start text-sm border-t border-gray-100 pt-2 first:border-t-0 first:pt-0"
                  >
                    <div>
                      <div className="font-medium">{d.description ?? d.type}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(d.due_at)} · {d.type.replace("_", " ")}
                      </div>
                    </div>
                    <span
                      className={
                        u === "overdue" || u === "high"
                          ? "badge-red"
                          : u === "medium"
                          ? "badge-amber"
                          : "badge-gray"
                      }
                    >
                      {u === "overdue" ? "overdue" : `${days}d`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <Disclaimer variant="deadline" className="mt-3" />
        </div>

        <div className="card card-pad">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Recent notices</h2>
            <Link href="/notices" className="text-sm text-brand-700">
              View all
            </Link>
          </div>
          {notices.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">
              No notices yet. Paste one in <Link href="/notices" className="text-brand-700">Notices</Link> for a plain-language explainer.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {notices.slice(0, 4).map((n) => (
                <li key={n.id} className="text-sm border-t border-gray-100 pt-2 first:border-t-0 first:pt-0">
                  <div className="font-medium">{n.title}</div>
                  <div className="text-xs text-gray-500">
                    {n.agency ?? "—"} · {n.received_at ? formatDate(n.received_at) : ""}
                  </div>
                  <Link href={`/notices/${n.id}`} className="mt-1 inline-block text-sm text-brand-700">
                    Read explainer →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="card card-pad">
          <h3 className="font-semibold">Ask a question</h3>
          <p className="mt-1 text-sm text-gray-600">Plain-language help, with disclaimers.</p>
          <Link href="/assistant" className="mt-3 inline-block btn-primary">
            Open assistant
          </Link>
        </div>
        <div className="card card-pad">
          <h3 className="font-semibold">Find a navigator</h3>
          <p className="mt-1 text-sm text-gray-600">Free help in your county. Placeholder for pilot directory.</p>
          <button className="mt-3 btn-secondary" disabled>
            Coming in pilot
          </button>
        </div>
        <div className="card card-pad">
          <h3 className="font-semibold">Local SNAP office</h3>
          <p className="mt-1 text-sm text-gray-600">{profile.county} County DSS — address and phone placeholder.</p>
          <button className="mt-3 btn-secondary" disabled>
            Coming in pilot
          </button>
        </div>
      </section>
    </div>
  );
}
