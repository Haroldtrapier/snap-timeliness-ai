"use client";
import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useBacklog } from "@/lib/backlog/store";
import { StatusBadge, RiskBadge, DocBadge, PriorityBar, PriorityTags, Disclaimer } from "@/components/backlog/badges";
import { CASE_STATUSES, DISCLAIMERS } from "@/lib/backlog/config";
import type { CaseStatus, DocStatus, PrescreenCategory } from "@/lib/backlog/types";

const BASE = "/app/agency/backlog";
const PRESCREEN_CLASS: Record<PrescreenCategory, string> = {
  "Likely eligible — worker review required": "bk-b-green",
  "Needs review": "bk-b-amber",
  "Missing information": "bk-b-gray",
  "Potential issue found": "bk-b-red",
};
const DOC_ACTIONS: DocStatus[] = ["Requested", "Received", "Verified", "Missing"];

export default function CaseDetail() {
  const params = useParams();
  const id = String(params?.id || "");
  const { getCase, state, activeWorkers, assignWorker, setStatus, setDocStatus, addNote, closeCase, logAudit } = useBacklog();
  const v = getCase(id);
  const [note, setNote] = useState("");
  const [prescreenLogged, setPrescreenLogged] = useState(false);
  const activity = useMemo(() => state.audit.filter((a) => a.caseId === id), [state.audit, id]);

  if (!v) {
    return (
      <div className="bk-panel">
        <h2>Case not found</h2>
        <p className="bk-note">Case “{id}” is not in this county’s dataset. <Link href={`${BASE}/cases`} style={{ textDecoration: "underline" }}>Back to cases</Link></p>
      </div>
    );
  }

  const netIncome = Math.max(0, v.monthlyIncome - v.monthlyExpenses);
  const submitNote = () => { if (note.trim()) { addNote(id, note.trim()); setNote(""); } };
  const logPrescreen = () => {
    logAudit("Eligibility pre-screen generated", id, { automated: true, next: v.prescreen.category, systemNote: "Pre-screen is decision support; worker review required." });
    setPrescreenLogged(true);
  };

  return (
    <>
      <div className="bk-pagehead">
        <div>
          <Link href={`${BASE}/cases`} className="bk-note">← All cases</Link>
          <h1 className="bk-h1" style={{ marginTop: 4 }}>{v.applicantLabel}</h1>
          <p className="bk-sub">{v.id} · {v.county?.name} · applied {new Date(v.applicationDate).toLocaleDateString()}</p>
        </div>
        <div className="bk-row">
          <StatusBadge status={v.status} />
          {v.expedited && <span className="bk-badge bk-b-purple">Expedited</span>}
          <RiskBadge label={v.deadlineRisk} />
        </div>
      </div>

      <Disclaimer text={DISCLAIMERS.case} />

      <div className="bk-two">
        <div style={{ display: "grid", gap: 16 }}>
          <div className="bk-panel">
            <h2>Case summary</h2>
            <div className="bk-cards" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))" }}>
              <Field label="Household size" value={v.householdSize} />
              <Field label="Reported income" value={`$${v.monthlyIncome}/mo`} />
              <Field label="Reported expenses" value={`$${v.monthlyExpenses}/mo`} />
              <Field label="Estimated net" value={`$${netIncome}/mo`} />
              <Field label="Days pending" value={v.daysPending} />
              <Field label="Deadline" value={v.daysUntilDeadline < 0 ? `${Math.abs(v.daysUntilDeadline)}d overdue` : `${v.daysUntilDeadline}d left`} />
            </div>
            {v.vulnerabilityFlags.length > 0 && (
              <div className="bk-row" style={{ marginTop: 12 }}>
                <span className="bk-note">Vulnerable household indicators:</span>
                {v.vulnerabilityFlags.map((f) => <span key={f} className="bk-badge bk-b-cyan">{f}</span>)}
              </div>
            )}
          </div>

          <div className="bk-panel">
            <h2>Priority explanation</h2>
            <div className="bk-row" style={{ marginBottom: 8 }}><PriorityBar score={v.priorityScore} band={v.priorityBand} /></div>
            <p style={{ margin: "0 0 10px" }}>{v.priorityExplanation}</p>
            <PriorityTags tags={v.priorityTags} />
          </div>

          <div className="bk-panel">
            <div className="bk-between"><h2 style={{ margin: 0 }}>Missing document checklist</h2><span className="bk-note">{v.missingRequiredDocs.length} required missing</span></div>
            {v.documents.map((d) => (
              <div key={d.key} className="bk-doc">
                <div>
                  <span className="bk-doclabel">{d.label}</span>{d.required && <span className="bk-badge bk-b-blue" style={{ marginLeft: 6 }}>required</span>}
                  <div className="bk-note">{d.history.length} status change(s) logged</div>
                </div>
                <div className="bk-row">
                  <DocBadge status={d.status} />
                  {DOC_ACTIONS.filter((a) => a !== d.status).map((a) => (
                    <button key={a} className="bk-btn subtle" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => setDocStatus(id, d.key, a)}>
                      {a === "Requested" ? "Mark requested" : a === "Received" ? "Mark received" : a === "Verified" ? "Verify" : "Mark missing"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bk-panel">
            <div className="bk-between"><h2 style={{ margin: 0 }}>Eligibility pre-screen (decision support)</h2><span className={`bk-badge ${PRESCREEN_CLASS[v.prescreen.category]}`}>{v.prescreen.category}</span></div>
            <ul className="bk-note" style={{ margin: "10px 0", paddingLeft: 18, lineHeight: 1.6, color: "#334155" }}>
              {v.prescreen.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
            <Disclaimer text={DISCLAIMERS.prescreen} />
            <div className="bk-row" style={{ marginTop: 10 }}>
              <button className="bk-btn ghost" onClick={logPrescreen} disabled={prescreenLogged}>{prescreenLogged ? "Pre-screen logged ✓" : "Record pre-screen in audit log"}</button>
            </div>
          </div>

          <div className="bk-panel">
            <h2>Worker notes</h2>
            <textarea className="bk-textarea" placeholder="Add a note for the case record…" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="bk-row" style={{ marginTop: 8 }}><button className="bk-btn" onClick={submitNote} disabled={!note.trim()}>Add note</button></div>
            <div className="bk-feed" style={{ marginTop: 14 }}>
              {v.notes.map((n) => (
                <div key={n.id} className="bk-feeditem"><span className="when">{new Date(n.at).toLocaleString()} · {n.by}</span><span>{n.text}</span></div>
              ))}
              {v.notes.length === 0 && <span className="bk-note">No notes yet.</span>}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div className="bk-panel">
            <h2>Actions</h2>
            <label className="bk-label" style={{ marginBottom: 12 }}>Assign worker
              <select className="bk-select" value={v.assignedWorkerId || ""} onChange={(e) => assignWorker(id, e.target.value)}>
                <option value="">Unassigned</option>
                {activeWorkers.map((w) => <option key={w.id} value={w.id}>{w.name} — {w.title}</option>)}
              </select>
            </label>
            <label className="bk-label" style={{ marginBottom: 12 }}>Status
              <select className="bk-select" value={v.status} onChange={(e) => setStatus(id, e.target.value as CaseStatus)}>
                {CASE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div className="bk-row">
              <button className="bk-btn" onClick={() => setStatus(id, "Ready for Review")} disabled={v.status === "Ready for Review"}>Move to ready for review</button>
              <button className="bk-btn ghost" onClick={() => closeCase(id)} disabled={v.status === "Completed"}>Close / mark reviewed</button>
            </div>
          </div>

          <div className="bk-panel">
            <h2>Case activity history</h2>
            <div className="bk-feed">
              {activity.map((a) => (
                <div key={a.id} className="bk-feeditem">
                  <span className="when">{new Date(a.at).toLocaleString()} · {a.userId}{a.automated ? " · system" : ""}</span>
                  <span><strong>{a.action}</strong>{a.prev || a.next ? `: ${a.prev ?? "—"} → ${a.next ?? "—"}` : ""}</span>
                  {a.systemNote && <span className="bk-note">{a.systemNote}</span>}
                </div>
              ))}
              {activity.length === 0 && <span className="bk-note">No recorded activity for this case yet.</span>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return <div className="bk-card"><div className="bk-stat-label">{label}</div><div className="bk-stat-value" style={{ fontSize: 22 }}>{value}</div></div>;
}
