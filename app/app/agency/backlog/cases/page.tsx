"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBacklog } from "@/lib/backlog/store";
import { StatusBadge, RiskBadge, PriorityBar } from "@/components/backlog/badges";

const BASE = "/app/agency/backlog";
type Toggle = "expedited" | "overdue" | "near" | "missing" | "ready";

export default function CasesPage() {
  const { views, activeWorkers } = useBacklog();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [toggles, setToggles] = useState<Record<Toggle, boolean>>({ expedited: false, overdue: false, near: false, missing: false, ready: false });
  const [worker, setWorker] = useState("all");

  const flip = (t: Toggle) => setToggles((s) => ({ ...s, [t]: !s[t] }));

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return views
      .filter((v) => {
        if (needle && !`${v.applicantLabel} ${v.id} ${v.status}`.toLowerCase().includes(needle)) return false;
        if (toggles.expedited && !v.expedited) return false;
        if (toggles.overdue && v.daysUntilDeadline >= 0) return false;
        if (toggles.near && !(v.daysUntilDeadline >= 0 && v.deadlineRisk === "High")) return false;
        if (toggles.missing && v.missingRequiredDocs.length === 0) return false;
        if (toggles.ready && v.status !== "Ready for Review") return false;
        if (worker !== "all") {
          if (worker === "unassigned" ? !!v.assignedWorkerId : v.assignedWorkerId !== worker) return false;
        }
        return true;
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [views, q, toggles, worker]);

  const chip = (t: Toggle, label: string) => (
    <button className={`bk-btn ${toggles[t] ? "" : "subtle"}`} style={{ padding: "7px 12px" }} onClick={() => flip(t)}>{label}</button>
  );

  return (
    <>
      <div className="bk-pagehead">
        <div>
          <h1 className="bk-h1">Cases</h1>
          <p className="bk-sub">{rows.length} of {views.length} cases shown. Search and filter the backlog, then open a case for full detail.</p>
        </div>
      </div>

      <div className="bk-panel">
        <div className="bk-row" style={{ marginBottom: 12 }}>
          <input className="bk-input" style={{ maxWidth: 320 }} placeholder="Search case ID, household, status…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="bk-select" value={worker} onChange={(e) => setWorker(e.target.value)}>
            <option value="all">All workers</option>
            <option value="unassigned">Unassigned</option>
            {activeWorkers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="bk-filters">
          {chip("expedited", "Expedited")}
          {chip("overdue", "Overdue")}
          {chip("near", "Near deadline")}
          {chip("missing", "Missing documents")}
          {chip("ready", "Ready for review")}
          <button className="bk-btn subtle" style={{ padding: "7px 12px" }} onClick={() => { setToggles({ expedited: false, overdue: false, near: false, missing: false, ready: false }); setWorker("all"); setQ(""); }}>Clear filters</button>
        </div>
      </div>

      <div className="bk-panel" style={{ padding: 0 }}>
        <div className="bk-table-wrap" style={{ border: 0 }}>
          <table className="bk-table">
            <thead>
              <tr><th>Case ID</th><th>Household</th><th>Applied</th><th>Days</th><th>Status</th><th>Exp.</th><th>Missing docs</th><th>Deadline risk</th><th>Priority</th><th>Worker</th></tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} onClick={() => router.push(`${BASE}/cases/${v.id}`)}>
                  <td><strong>{v.id}</strong></td>
                  <td>{v.applicantLabel}<div className="bk-note">HH {v.householdSize}</div></td>
                  <td>{new Date(v.applicationDate).toLocaleDateString()}</td>
                  <td className="num">{v.daysPending}</td>
                  <td><StatusBadge status={v.status} /></td>
                  <td>{v.expedited ? <span className="bk-badge bk-b-purple">Expedited</span> : <span className="bk-note">—</span>}</td>
                  <td>{v.missingRequiredDocs.length > 0 ? <span className="bk-badge bk-b-amber">{v.missingRequiredDocs.length} required</span> : <span className="bk-note">Complete</span>}</td>
                  <td><RiskBadge label={v.deadlineRisk} /></td>
                  <td style={{ minWidth: 120 }}><PriorityBar score={v.priorityScore} band={v.priorityBand} /></td>
                  <td>{v.worker?.name || <span className="bk-note">Unassigned</span>}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={10} className="bk-note" style={{ padding: 20 }}>No cases match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
