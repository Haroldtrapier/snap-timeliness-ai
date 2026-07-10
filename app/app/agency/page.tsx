import type { Metadata } from "next";
import Link from "next/link";
import AgencyDashboard from "@/components/dashboards/AgencyDashboard";
import { getSession } from "@/lib/auth";
import { getAgencyCaseload } from "@/lib/repositories";

export const metadata: Metadata = {
  title: "Agency console · SNAP AI",
};

const TOOLS = [
  {
    href: "/app/agency/backlog",
    tag: "Command center",
    title: "Backlog AI",
    body: "Upload a backlog CSV, see county backlog risk, rank urgent cases with plain-language explanations, and generate leadership reports.",
    cta: "Open Backlog AI",
    primary: true,
  },
  {
    href: "/app/agency/queue",
    tag: "Case work",
    title: "Review queue",
    body: "Document-level review: verify submitted documents or request re-uploads. Each decision writes an applicant note and an audit entry.",
    cta: "Open review queue",
    primary: false,
  },
  {
    href: "/app/agency/reports",
    tag: "Analytics",
    title: "Reports",
    body: "Timeliness analytics across the live caseload — on-time rate, days-to-decide, and case-age buckets.",
    cta: "Open reports",
    primary: false,
  },
];

export default async function AgencyPage() {
  const session = await getSession();
  const data = await getAgencyCaseload(session?.id);

  return (
    <div className="app-surface">
      <div className="section-head">
        <h1 className="section-title">Agency console</h1>
        <p className="section-sub">
          Start in the <strong>Backlog AI command center</strong> to triage and prioritize your county
          backlog, use the <strong>Review queue</strong> for document-level case work, and <strong>Reports</strong>{" "}
          for timeliness analytics. Every flag is a signal for a caseworker — SNAP AI never makes the final decision.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 22 }}>
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="card" style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="card-title">
              {t.title} <span className="meta">{t.tag}</span>
            </div>
            <p className="section-sub" style={{ margin: 0, flex: 1 }}>{t.body}</p>
            <span className={`btn ${t.primary ? "btn-primary" : "btn-ghost"} btn-tiny`} style={{ alignSelf: "flex-start" }}>{t.cta} →</span>
          </Link>
        ))}
      </div>

      <AgencyDashboard data={data} />
    </div>
  );
}
