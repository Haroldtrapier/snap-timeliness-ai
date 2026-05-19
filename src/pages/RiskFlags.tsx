import { useCases } from '../state/CaseStore';
import type { Severity } from '../types';

function sevBadge(s: Severity) {
  if (s === 'high') return <span className="badge red">high</span>;
  if (s === 'medium') return <span className="badge amber">medium</span>;
  return <span className="badge gray">low</span>;
}

export default function RiskFlags() {
  const { cases } = useCases();
  const allFlags = cases.flatMap((c) =>
    c.riskFlags.map((f) => ({ ...f, caseId: c.id, applicant: c.applicantName })),
  );

  const examples = [
    'missing required documents',
    'mismatched names',
    'duplicate household members',
    'same address used across multiple applications',
    'utility bill in child\'s name',
    'income inconsistency',
    'possible fake or altered document',
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Risk / Integrity Flags</h1>
          <p>Surfaces possible inconsistencies for review. SNAP AI never accuses applicants of fraud and never auto-denies benefits.</p>
        </div>
      </div>

      <div className="card">
        <h3>Detection coverage</h3>
        <div className="row">
          {examples.map((e) => <span key={e} className="badge">{e}</span>)}
        </div>
      </div>

      <div className="spacer" />
      <div className="card">
        <h3>Live flags ({allFlags.length})</h3>
        {allFlags.length === 0 ? (
          <p className="muted">No flags raised across the current case load.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Applicant</th>
                <th>Flag</th>
                <th>Severity</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {allFlags.map((f) => (
                <tr key={`${f.caseId}-${f.id}`}>
                  <td><strong>{f.caseId}</strong></td>
                  <td>{f.applicant}</td>
                  <td>{f.type}</td>
                  <td>{sevBadge(f.severity)}</td>
                  <td>
                    {f.detail}
                    {f.severity === 'high' && (
                      <div className="review-banner" style={{ marginTop: '0.4rem' }}>Requires human review</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="spacer" />
      <div className="disclaimer">
        Flag language is intentionally non-accusatory ("possible inconsistency", "requires review"). Final determinations remain with authorized agency staff.
      </div>
    </div>
  );
}
