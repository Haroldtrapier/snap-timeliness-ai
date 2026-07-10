"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBacklog } from "@/lib/backlog/store";
import { StatCard, RiskBadge, PriorityBar, PriorityTags, SeverityBadge, Disclaimer } from "@/components/backlog/badges";

const BASE = "/app/agency/backlog";

export default function BacklogDashboard() {
  const { state, metrics, trend, views, alerts } = useBacklog();
  const router = useRouter();
  const county = state.counties.find((c) => c.id === state.activeCountyId);
  const topPriority = [...views].filter((v) => v.status !== "Completed").sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 6);
  const delta = trend.delta;
  const deltaLabel = delta === 0 ? "No weekly change" : delta > 0 ? `▲ ${delta} more than last week` : `▼ ${Math.abs(delta)} fewer than last week`;

  return (
    <>
      <div className="bk-pagehead">
        <div>
          <h1 className="bk-h1">{county?.name} — Backlog Command Center</h1>
          <p className="bk-sub">Upload your SNAP backlog, see county risk, prioritize urgent cases, and generate a leadership report.</p>
        </div>
        <div className="bk-row">
          <Link href={`${BASE}/upload`} className="bk-btn">Upload cases</Link>
          <Link href={`${BASE}/queue`} className="bk-btn ghost">Priority queue</Link>
          <Link href="/app/agency/queue" className="bk-btn subtle" title="Document-level case review">Review queue →</Link>
        </div>
      </div>

      <Disclaimer text="SNAP AI is human-in-the-loop decision support. It highlights and ranks cases for worker review — it does not approve, deny, or replace caseworkers." />

      <div className="bk-cards">
        <StatCard label="Total pending" value={metrics.totalPending} note="Open applications in county" />
        <StatCard label="Expedited" value={metrics.expedited} note="7-day federal standard" />
        <StatCard label="Overdue" value={metrics.overdue} note="Past processing deadline" />
        <StatCard label="Near deadline" value={metrics.nearDeadline} note="Within 3 days" />
        <StatCard label="Missing documents" value={metrics.missingDocs} note="Blocked on verification" />
        <StatCard label="Ready for review" value={metrics.readyForReview} note="Awaiting worker sign-off" />
      </div>

      <div className="bk-two">
        <div className="bk-panel">
          <div className="bk-between" style={{ marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Top priority cases</h2>
            <Link href={`${BASE}/queue`} className="bk-note">View full queue →</Link>
          </div>
          <div className="bk-table-wrap">
            <table className="bk-table">
              <thead>
                <tr><th>Case</th><th>Priority</th><th>Status</th><th>Days</th><th>Deadline</th><th>Tags</th></tr>
              </thead>
              <tbody>
                {topPriority.map((v) => (
                  <tr key={v.id} onClick={() => router.push(`${BASE}/cases/${v.id}`)}>
                    <td><strong>{v.applicantLabel}</strong><div className="bk-note">{v.id}</div></td>
                    <td><PriorityBar score={v.priorityScore} band={v.priorityBand} /></td>
                    <td>{v.status}</td>
                    <td className="num">{v.daysPending}</td>
                    <td>{v.daysUntilDeadline < 0 ? `${Math.abs(v.daysUntilDeadline)}d overdue` : `${v.daysUntilDeadline}d left`}</td>
                    <td><PriorityTags tags={v.priorityTags.filter((t) => t !== "Worker Review Required").slice(0, 3)} /></td>
                  </tr>
                ))}
                {topPriority.length === 0 && <tr><td colSpan={6} className="bk-note">No open cases. Upload a CSV to load a backlog.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div className="bk-panel">
            <h2>Backlog risk</h2>
            <div className="bk-row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="bk-stat-value" style={{ fontSize: 40 }}>{metrics.backlogRiskScore}</div>
                <div className="bk-note">Risk score (0–100)</div>
              </div>
              <RiskBadge label={metrics.backlogRiskLabel} />
            </div>
            <div className="bk-prbar" style={{ marginTop: 10 }}>
              <div className="bk-prbar-fill" style={{ width: `${metrics.backlogRiskScore}%`, background: metrics.backlogRiskScore >= 45 ? "#dc2626" : metrics.backlogRiskScore >= 20 ? "#d97706" : "#16a34a" }} />
            </div>
            <div className="bk-note" style={{ marginTop: 10 }}>Timeliness score <strong>{metrics.timelinessScore}/100</strong> · Avg {metrics.avgDaysPending} days pending</div>
          </div>

          <div className="bk-cards" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <StatCard label="New this week" value={trend.thisWeek} note={deltaLabel} />
            <StatCard label="Prior week" value={trend.lastWeek} note="Applications 8–14 days ago" />
          </div>

          <div className="bk-panel">
            <div className="bk-between" style={{ marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>Active alerts</h2>
              <Link href={`${BASE}/alerts`} className="bk-note">All alerts →</Link>
            </div>
            <div className="bk-feed">
              {alerts.slice(0, 4).map((a) => (
                <div key={a.id} className="bk-row" style={{ justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13 }}>{a.message}</span>
                  <SeverityBadge severity={a.severity} />
                </div>
              ))}
              {alerts.length === 0 && <span className="bk-note">No active alerts for this county.</span>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
