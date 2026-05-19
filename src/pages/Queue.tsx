import { useMemo, useState } from 'react';
import { useCases } from '../state/CaseStore';
import type { QueueStatus } from '../types';

const PRIORITY_ORDER: Record<string, number> = { expedited: 0, high: 1, normal: 2, low: 3 };
const STATUSES: QueueStatus[] = [
  'intake complete',
  'missing documents',
  'risk review',
  'expedited review',
  'ready for caseworker',
];

function statusBadge(s: QueueStatus) {
  if (s === 'expedited review') return <span className="badge red">{s}</span>;
  if (s === 'risk review') return <span className="badge amber">{s}</span>;
  if (s === 'missing documents') return <span className="badge amber">{s}</span>;
  if (s === 'ready for caseworker') return <span className="badge green">{s}</span>;
  return <span className="badge gray">{s}</span>;
}

export default function Queue() {
  const { cases, setQueueStatus, assignReviewer } = useCases();
  const [reviewerInput, setReviewerInput] = useState<Record<string, string>>({});

  const sorted = useMemo(
    () => [...cases].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)),
    [cases],
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Human Review Queue</h1>
          <p>Cases prioritized for caseworker action. SNAP AI surfaces priorities — agency staff make every decision.</p>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Case</th>
              <th>Applicant</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Reviewer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.id}</strong></td>
                <td>{c.applicantName}</td>
                <td>
                  <span className={`badge ${c.priority === 'expedited' ? 'red' : c.priority === 'high' ? 'amber' : 'gray'}`}>
                    {c.priority}
                  </span>
                </td>
                <td>
                  <select
                    value={c.queueStatus}
                    onChange={(e) => setQueueStatus(c.id, e.target.value as QueueStatus)}
                    style={{ width: 'auto' }}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ marginTop: '0.3rem' }}>{statusBadge(c.queueStatus)}</div>
                </td>
                <td>
                  <div className="row">
                    <input
                      placeholder={c.assignedReviewer ?? 'reviewer name'}
                      value={reviewerInput[c.id] ?? ''}
                      onChange={(e) => setReviewerInput({ ...reviewerInput, [c.id]: e.target.value })}
                      style={{ minWidth: 140 }}
                    />
                    <button
                      className="secondary"
                      onClick={() => {
                        const name = reviewerInput[c.id];
                        if (name) assignReviewer(c.id, name);
                      }}
                    >
                      Assign
                    </button>
                  </div>
                  {c.assignedReviewer && <div className="small muted">Assigned: {c.assignedReviewer}</div>}
                </td>
                <td>
                  <div className="row">
                    <button className="ghost" onClick={() => setQueueStatus(c.id, 'missing documents')}>Request docs</button>
                    <button className="ghost" onClick={() => setQueueStatus(c.id, 'ready for caseworker')}>Mark reviewed</button>
                    <button className="ghost" onClick={() => setQueueStatus(c.id, 'expedited review')}>Escalate</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="spacer" />
      <div className="disclaimer">
        SNAP AI provides decision support only. Final eligibility decisions remain with authorized agency staff.
      </div>
    </div>
  );
}
