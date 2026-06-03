import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getAgencyReports, getCaseworkerOrgCount } from "@/lib/repositories";

export const metadata: Metadata = {
  title: "Reports · SNAP AI",
};

function Bars({
  rows,
  color = "var(--green)",
}: {
  rows: { label: string; count: number }[];
  color?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="bars">
      {rows.map((r) => (
        <div className="bar-row" key={r.label}>
          <div className="bar-label">{r.label}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(r.count / max) * 100}%`, background: color }} />
          </div>
          <div className="bar-count mono">{r.count}</div>
        </div>
      ))}
    </div>
  );
}

export default async function ReportsPage() {
  const session = await getSession();

  if (session && session.role !== "agency") {
    return (
      <div className="app-surface">
        <div className="section-head">
          <h1 className="section-title">Reports</h1>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: 0, color: "var(--ink-2)" }}>This area is for agency staff.</p>
        </div>
      </div>
    );
  }

  const [reports, orgCount] = await Promise.all([
    getAgencyReports(session?.id),
    getCaseworkerOrgCount(session?.id),
  ]);

  if (!reports || reports.total === 0) {
    return (
      <div className="app-surface">
        <div className="section-head">
          <h1 className="section-title">Reports</h1>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: 0, color: "var(--ink-2)" }}>
            {orgCount === 0
              ? "Your account hasn't been added to an organization yet. An administrator must grant access before reports appear here."
              : "No cases to report on yet."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-surface">
      <div className="section-head">
        <h1 className="section-title">Reports</h1>
        <p className="section-sub">
          Caseload analytics for your organization. Timeliness is the federal 30-day standard.
        </p>
      </div>

      <div className="metrics-row" style={{ marginBottom: 20 }}>
        <div className="metric">
          <div className="label mono">Total cases</div>
          <div className="value">{reports.total}</div>
          <div className="delta flat">· in your org</div>
        </div>
        <div className="metric">
          <div className="label mono">On-time rate (30d)</div>
          <div className="value">
            {reports.onTimeRate.toFixed(1)}
            <small>%</small>
          </div>
          <div className="delta up">{reports.decidedTotal} decided</div>
        </div>
        <div className="metric">
          <div className="label mono">Avg. days to decide</div>
          <div className="value">{reports.avgDays ? reports.avgDays.toFixed(1) : "—"}</div>
          <div className="delta up">decided cases</div>
        </div>
        <div className="metric">
          <div className="label mono">Backlog (&gt;30d)</div>
          <div className="value">{reports.backlog}</div>
          <div className={"delta " + (reports.backlog > 0 ? "down" : "flat")}>open &gt; 30 days</div>
        </div>
      </div>

      <div className="reports-grid">
        <div className="card" style={{ padding: 20 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>
            <span>Cases by stage</span>
          </div>
          <Bars rows={reports.byStage.map((s) => ({ label: s.stage, count: s.count }))} />
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>
            <span>Open case age</span>
            <span className="meta">{reports.expedited} expedited</span>
          </div>
          <Bars rows={reports.aging} color="var(--amber)" />
        </div>
      </div>
    </div>
  );
}
