"use client";
import { useMemo, useState } from "react";
import { useBacklog } from "@/lib/backlog/store";
import { downloadText } from "@/lib/backlog/csv";
import { BACKLOG_ROLES } from "@/lib/backlog/config";

const ROLE_ACCESS: Record<string, string> = {
  Admin: "Full access — configuration, audit logs, all counties, user management.",
  Supervisor: "County dashboard, priority queue, reports, assign workers, close cases.",
  Caseworker: "Assigned cases, document updates, notes, pre-screen support.",
  Viewer: "Read-only dashboards and reports. No case mutations.",
};

export default function AdminPage() {
  const { state, resetDemo } = useBacklog();
  const [actionFilter, setActionFilter] = useState("All");
  const [confirmReset, setConfirmReset] = useState(false);

  const actions = useMemo(() => ["All", ...Array.from(new Set(state.audit.map((a) => a.action)))], [state.audit]);
  const rows = state.audit.filter((a) => actionFilter === "All" || a.action === actionFilter);

  const exportAudit = () => {
    const header = ["timestamp", "user_id", "case_id", "county_id", "action", "previous", "new", "system_note", "automated"];
    const lines = state.audit.map((a) => {
      const map: Record<string, string> = {
        timestamp: a.at,
        user_id: a.userId,
        case_id: a.caseId,
        county_id: a.countyId,
        action: a.action,
        previous: a.prev ?? "",
        new: a.next ?? "",
        system_note: a.systemNote ?? "",
        automated: a.automated ? "yes" : "no",
      };
      return header.map((h) => `"${String(map[h]).replace(/"/g, '""')}"`).join(",");
    });
    downloadText("snap-ai-audit-log.csv", [header.join(","), ...lines].join("\n"));
  };

  return (
    <>
      <div className="bk-pagehead">
        <div>
          <h1 className="bk-h1">Audit &amp; Roles</h1>
          <p className="bk-sub">Append-only audit log, role-based access structure, workers, and demo controls.</p>
        </div>
        <div className="bk-row">
          <button className="bk-btn ghost" onClick={exportAudit}>Export audit log (CSV)</button>
          {confirmReset ? (
            <button className="bk-btn danger" onClick={() => { resetDemo(); setConfirmReset(false); }}>Confirm reset</button>
          ) : (
            <button className="bk-btn subtle" onClick={() => setConfirmReset(true)}>Reset demo data</button>
          )}
        </div>
      </div>

      <div className="bk-two">
        <div className="bk-panel" style={{ padding: 0 }}>
          <div className="bk-between" style={{ padding: "16px 16px 8px" }}>
            <h2 style={{ margin: 0 }}>Audit log ({state.audit.length})</h2>
            <select className="bk-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="bk-table-wrap" style={{ border: 0, maxHeight: 520 }}>
            <table className="bk-table">
              <thead><tr><th>Time</th><th>User</th><th>Case</th><th>Action</th><th>Previous → New</th></tr></thead>
              <tbody>
                {rows.slice(0, 300).map((a) => (
                  <tr key={a.id}>
                    <td className="bk-note">{new Date(a.at).toLocaleString()}</td>
                    <td>{a.userId}{a.automated ? <span className="bk-badge bk-b-gray" style={{ marginLeft: 4 }}>system</span> : ""}</td>
                    <td>{a.caseId}</td>
                    <td><strong>{a.action}</strong>{a.systemNote && <div className="bk-note">{a.systemNote}</div>}</td>
                    <td className="bk-note">{a.prev || a.next ? `${a.prev ?? "—"} → ${a.next ?? "—"}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div className="bk-panel">
            <h2>Role-based access</h2>
            {BACKLOG_ROLES.map((r) => (
              <div key={r} className="bk-doc">
                <div><span className="bk-doclabel">{r}</span><div className="bk-note">{ROLE_ACCESS[r]}</div></div>
                {state.role === r && <span className="bk-badge bk-b-blue">active</span>}
              </div>
            ))}
          </div>

          <div className="bk-panel">
            <h2>Workers — {state.counties.find((c) => c.id === state.activeCountyId)?.name}</h2>
            {state.workers.filter((w) => w.countyId === state.activeCountyId).map((w) => {
              const load = state.cases.filter((c) => c.assignedWorkerId === w.id && c.status !== "Completed").length;
              return (
                <div key={w.id} className="bk-doc">
                  <div><span className="bk-doclabel">{w.name}</span><div className="bk-note">{w.title} · {w.role}</div></div>
                  <span className={`bk-badge ${load > 8 ? "bk-b-red" : "bk-b-gray"}`}>{load} open</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
