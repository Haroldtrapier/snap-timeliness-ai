"use client";
import { useMemo, useState, type ReactNode } from "react";
import { useBacklog } from "@/lib/backlog/store";
import { buildReport, type ReportType } from "@/lib/backlog/report";
import { DISCLAIMERS } from "@/lib/backlog/config";
import { RiskBadge, Disclaimer } from "@/components/backlog/badges";

const TYPES: ReportType[] = ["Daily backlog report", "Weekly leadership report", "Case aging report", "Priority queue report"];

export default function ReportsPage() {
  const { views, state, logAudit } = useBacklog();
  const county = state.counties.find((c) => c.id === state.activeCountyId);
  const [type, setType] = useState<ReportType>("Weekly leadership report");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const report = useMemo(() => buildReport(type, county, views), [type, county, views]);

  const generate = () => {
    setGeneratedAt(new Date().toLocaleString());
    logAudit("Report generated", "-", { next: type, systemNote: `${type} generated for ${report.countyName}.` });
  };
  const printReport = () => { generate(); setTimeout(() => window.print(), 60); };

  const m = report.metrics;
  return (
    <>
      <div className="bk-pagehead bk-noprint">
        <div>
          <h1 className="bk-h1">Reports Center</h1>
          <p className="bk-sub">Generate leadership-ready backlog reports. Use “Print / Save as PDF” to export.</p>
        </div>
        <div className="bk-row">
          <select className="bk-select" value={type} onChange={(e) => setType(e.target.value as ReportType)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="bk-btn ghost" onClick={generate}>Generate</button>
          <button className="bk-btn" onClick={printReport}>Print / Save as PDF</button>
        </div>
      </div>

      <div className="bk-report" id="bk-report">
        <div className="bk-between">
          <div>
            <h1>{report.type}</h1>
            <div className="rmeta">{report.countyName} · Generated {generatedAt || new Date().toLocaleString()}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="bk-note">Backlog risk</div>
            <div className="bk-row" style={{ justifyContent: "flex-end" }}><strong style={{ fontSize: 22 }}>{m.backlogRiskScore}</strong><RiskBadge label={m.backlogRiskLabel} /></div>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: "18px 0" }} />

        <div className="bk-cards">
          <Cell label="Total pending" value={m.totalPending} />
          <Cell label="Expedited" value={m.expedited} />
          <Cell label="Overdue" value={m.overdue} />
          <Cell label="Near deadline" value={m.nearDeadline} />
          <Cell label="Missing documents" value={m.missingDocs} />
          <Cell label="Avg days pending" value={m.avgDaysPending} />
        </div>

        <h2 style={{ marginTop: 22 }}>Backlog risk summary</h2>
        <p className="bk-note" style={{ color: "#334155" }}>
          {county?.name} carries a backlog risk score of <strong>{m.backlogRiskScore}/100 ({m.backlogRiskLabel})</strong> and a timeliness score of <strong>{m.timelinessScore}/100</strong>.
          {" "}This week {report.trend.thisWeek} new application(s) were received versus {report.trend.lastWeek} the prior week
          ({report.trend.delta >= 0 ? `+${report.trend.delta}` : report.trend.delta}).
        </p>

        {type === "Case aging report" && (
          <>
            <h2 style={{ marginTop: 18 }}>Case aging</h2>
            <div className="bk-table-wrap"><table className="bk-table" style={{ minWidth: "auto" }}>
              <thead><tr><th>Age bucket</th><th>Open cases</th></tr></thead>
              <tbody>{report.agingBuckets.map((b) => <tr key={b.label}><td>{b.label}</td><td className="num">{b.count}</td></tr>)}</tbody>
            </table></div>
          </>
        )}

        {(type === "Priority queue report" || type === "Daily backlog report" || type === "Weekly leadership report") && (
          <>
            <h2 style={{ marginTop: 18 }}>Top priority cases</h2>
            <div className="bk-table-wrap"><table className="bk-table">
              <thead><tr><th>Case</th><th>Priority</th><th>Status</th><th>Deadline</th><th>Rationale</th></tr></thead>
              <tbody>{report.topPriority.map((v) => (
                <tr key={v.id}><td>{v.applicantLabel} ({v.id})</td><td className="num">{v.priorityScore}</td><td>{v.status}</td>
                  <td>{v.daysUntilDeadline < 0 ? `${Math.abs(v.daysUntilDeadline)}d overdue` : `${v.daysUntilDeadline}d left`}</td>
                  <td className="bk-note" style={{ color: "#334155" }}>{v.priorityExplanation}</td></tr>
              ))}</tbody>
            </table></div>
          </>
        )}

        <h2 style={{ marginTop: 18 }}>Recommended supervisor actions</h2>
        <ol style={{ lineHeight: 1.7, color: "#334155" }}>{report.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}</ol>

        <div style={{ marginTop: 20 }}><Disclaimer text={DISCLAIMERS.report} /></div>
      </div>
    </>
  );
}

function Cell({ label, value }: { label: string; value: ReactNode }) {
  return <div className="bk-card"><div className="bk-stat-label">{label}</div><div className="bk-stat-value">{value}</div></div>;
}
