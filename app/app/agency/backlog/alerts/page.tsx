"use client";
import { useState } from "react";
import Link from "next/link";
import { useBacklog } from "@/lib/backlog/store";
import { SeverityBadge } from "@/components/backlog/badges";
import type { AlertSeverity } from "@/lib/backlog/types";

const BASE = "/app/agency/backlog";
const SEVS: (AlertSeverity | "All")[] = ["All", "Critical", "High", "Medium", "Low"];

export default function AlertsPage() {
  const { alerts, state } = useBacklog();
  const [sev, setSev] = useState<AlertSeverity | "All">("All");
  const filtered = alerts.filter((a) => sev === "All" || a.severity === sev);
  const county = state.counties.find((c) => c.id === state.activeCountyId);
  const counts = {
    Critical: alerts.filter((a) => a.severity === "Critical").length,
    High: alerts.filter((a) => a.severity === "High").length,
    Medium: alerts.filter((a) => a.severity === "Medium").length,
    Low: alerts.filter((a) => a.severity === "Low").length,
  };

  return (
    <>
      <div className="bk-pagehead">
        <div>
          <h1 className="bk-h1">Alerts</h1>
          <p className="bk-sub">In-app alerts for {county?.name}, derived live from case and workload data.</p>
        </div>
      </div>

      <div className="bk-cards">
        <div className="bk-card"><div className="bk-stat-label">Critical</div><div className="bk-stat-value" style={{ color: "#dc2626" }}>{counts.Critical}</div></div>
        <div className="bk-card"><div className="bk-stat-label">High</div><div className="bk-stat-value" style={{ color: "#ea580c" }}>{counts.High}</div></div>
        <div className="bk-card"><div className="bk-stat-label">Medium</div><div className="bk-stat-value" style={{ color: "#d97706" }}>{counts.Medium}</div></div>
        <div className="bk-card"><div className="bk-stat-label">Low</div><div className="bk-stat-value" style={{ color: "#64748b" }}>{counts.Low}</div></div>
      </div>

      <div className="bk-filters">
        {SEVS.map((s) => <button key={s} className={`bk-btn ${sev === s ? "" : "subtle"}`} style={{ padding: "7px 12px" }} onClick={() => setSev(s)}>{s}</button>)}
      </div>

      <div className="bk-feed">
        {filtered.map((a) => (
          <div key={a.id} className={`bk-alert sev-${a.severity}`}>
            <div style={{ flex: 1 }}>
              <div className="bk-row" style={{ justifyContent: "space-between" }}>
                <strong>{a.type}</strong>
                <SeverityBadge severity={a.severity} />
              </div>
              <div style={{ fontSize: 14, marginTop: 2 }}>{a.message}</div>
              {a.caseId && <Link href={`${BASE}/cases/${a.caseId}`} className="bk-note" style={{ textDecoration: "underline" }}>Open case {a.caseId} →</Link>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="bk-panel bk-note">No alerts at this severity for {county?.name}.</div>}
      </div>
    </>
  );
}
