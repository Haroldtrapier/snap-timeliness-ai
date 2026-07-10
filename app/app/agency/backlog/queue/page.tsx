"use client";
import { useRouter } from "next/navigation";
import { useBacklog } from "@/lib/backlog/store";
import { PriorityBar, PriorityTags, StatusBadge, Disclaimer } from "@/components/backlog/badges";

const BASE = "/app/agency/backlog";

export default function QueuePage() {
  const { views } = useBacklog();
  const router = useRouter();
  const ranked = [...views].filter((v) => v.status !== "Completed").sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <>
      <div className="bk-pagehead">
        <div>
          <h1 className="bk-h1">Priority Queue</h1>
          <p className="bk-sub">Cases ranked by urgency. Every score includes an explanation so supervisors know exactly why a case is prioritized.</p>
        </div>
      </div>
      <Disclaimer text="Priority scores are a triage aid only. Final SNAP eligibility decisions remain with authorized agency staff — worker review is required on every case." />

      <div className="bk-panel" style={{ padding: 0 }}>
        <div className="bk-table-wrap" style={{ border: 0 }}>
          <table className="bk-table">
            <thead>
              <tr><th>#</th><th>Case</th><th>Priority</th><th>Why this priority</th><th>Status</th><th>Deadline</th><th>Tags</th></tr>
            </thead>
            <tbody>
              {ranked.map((v, i) => (
                <tr key={v.id} onClick={() => router.push(`${BASE}/cases/${v.id}`)}>
                  <td className="num">{i + 1}</td>
                  <td><strong>{v.applicantLabel}</strong><div className="bk-note">{v.id} · HH {v.householdSize}</div></td>
                  <td style={{ minWidth: 130 }}><PriorityBar score={v.priorityScore} band={v.priorityBand} /></td>
                  <td style={{ maxWidth: 320 }}><span className="bk-note" style={{ color: "#334155" }}>{v.priorityExplanation}</span></td>
                  <td><StatusBadge status={v.status} /></td>
                  <td>{v.daysUntilDeadline < 0 ? <span style={{ color: "#991b1b", fontWeight: 700 }}>{Math.abs(v.daysUntilDeadline)}d overdue</span> : `${v.daysUntilDeadline}d left`}</td>
                  <td><PriorityTags tags={v.priorityTags.filter((t) => t !== "Worker Review Required")} /></td>
                </tr>
              ))}
              {ranked.length === 0 && <tr><td colSpan={7} className="bk-note" style={{ padding: 20 }}>No open cases for this county. Upload a backlog CSV to begin.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
