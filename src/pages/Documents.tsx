import { useState } from 'react';
import { useCases } from '../state/CaseStore';
import type { DocStatus } from '../types';

const STATUS_OPTIONS: DocStatus[] = ['received', 'missing', 'needs review', 'possible mismatch'];

function statusBadge(s: DocStatus) {
  if (s === 'received') return <span className="badge green">received</span>;
  if (s === 'missing') return <span className="badge red">missing</span>;
  if (s === 'needs review') return <span className="badge amber">needs review</span>;
  return <span className="badge amber">possible mismatch</span>;
}

export default function Documents() {
  const { cases, updateCase } = useCases();
  const [activeId, setActiveId] = useState<string>(cases[0]?.id ?? '');
  const active = cases.find((c) => c.id === activeId);

  if (!active) return <p>No cases available.</p>;

  function setStatus(key: string, status: DocStatus) {
    if (!active) return;
    updateCase(active.id, {
      documents: active.documents.map((d) => (d.key === key ? { ...d, status } : d)),
    });
  }

  function mockUpload(key: string) {
    setStatus(key, 'received');
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Document Review</h1>
          <p>Required-document checklist with status tracking and mismatch indicators. Mock uploads only — no real documents accepted.</p>
        </div>
        <div>
          <label>Case</label>
          <select value={activeId} onChange={(e) => setActiveId(e.target.value)}>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.id} — {c.applicantName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <h3>Mock upload area</h3>
        <p className="muted small">Drag-and-drop is mocked for the demo. Click <em>Mark received</em> to simulate upload, or change status via dropdown.</p>
        <ul className="checklist">
          {active.documents.map((d) => (
            <li key={d.key}>
              <div>
                <div className="doc-name">
                  {d.label} {d.required ? <span className="badge gray">required</span> : <span className="badge gray">optional</span>}
                </div>
                {d.note && <div className="doc-note">Note: {d.note}</div>}
              </div>
              <div className="row">
                {statusBadge(d.status)}
                <select
                  value={d.status}
                  onChange={(e) => setStatus(d.key, e.target.value as DocStatus)}
                  style={{ width: 'auto' }}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="secondary" onClick={() => mockUpload(d.key)}>Mark received</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="spacer" />
      <div className="card">
        <h3>Fake / altered document risk examples</h3>
        <p className="muted small">SNAP AI surfaces possible inconsistencies. It does not accuse applicants of fraud. All findings route to human review.</p>
        <table className="table">
          <thead>
            <tr><th>Risk type</th><th>Example</th><th>Severity</th></tr>
          </thead>
          <tbody>
            <tr><td>Name mismatch</td><td>ID name "Tyron Walker" vs application "Tyrone Walker"</td><td><span className="badge amber">medium</span></td></tr>
            <tr><td>Address mismatch</td><td>Utility bill address differs from lease address</td><td><span className="badge amber">medium</span></td></tr>
            <tr><td>Altered date</td><td>Date field on ID document appears modified</td><td><span className="badge red">high</span></td></tr>
            <tr><td>Duplicate document</td><td>Same pay stub uploaded for two different cases</td><td><span className="badge red">high</span></td></tr>
            <tr><td>Child’s name on utility bill</td><td>Utility bill issued to minor in household</td><td><span className="badge amber">medium</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
