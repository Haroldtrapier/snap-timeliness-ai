import { Link } from 'react-router-dom';
import { useCases } from '../state/CaseStore';

export default function Dashboard() {
  const { cases } = useCases();
  const total = cases.length;
  const pending = cases.filter((c) => c.queueStatus !== 'ready for caseworker').length;
  const missingDocs = cases.filter((c) =>
    c.documents.some((d) => d.required && d.status === 'missing'),
  ).length;
  const riskFlagsCount = cases.reduce((acc, c) => acc + c.riskFlags.length, 0);
  const highRiskCases = cases.filter((c) => c.riskFlags.some((f) => f.severity === 'high'));
  const expedited = cases.filter((c) => c.priority === 'expedited');

  const priorityCases = [...expedited, ...highRiskCases]
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)
    .slice(0, 6);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Caseworker Dashboard</h1>
          <p>Snapshot of today’s SNAP application activity for your queue.</p>
        </div>
      </div>

      <div className="grid cols-4">
        <div className="stat">
          <div className="label">Total applications</div>
          <div className="value">{total}</div>
          <div className="sub">in pilot queue</div>
        </div>
        <div className="stat">
          <div className="label">Pending review</div>
          <div className="value">{pending}</div>
          <div className="sub">awaiting action</div>
        </div>
        <div className="stat">
          <div className="label">Missing documents</div>
          <div className="value">{missingDocs}</div>
          <div className="sub">cases need follow-up</div>
        </div>
        <div className="stat">
          <div className="label">Risk flags</div>
          <div className="value">{riskFlagsCount}</div>
          <div className="sub">across all cases</div>
        </div>
      </div>

      <div className="spacer" />
      <div className="grid cols-2">
        <div className="stat">
          <div className="label">Avg. processing time saved</div>
          <div className="value">42%</div>
          <div className="sub">vs. manual baseline (pilot estimate)</div>
        </div>
        <div className="stat">
          <div className="label">High-severity flags</div>
          <div className="value">{cases.reduce((a, c) => a + c.riskFlags.filter((f) => f.severity === 'high').length, 0)}</div>
          <div className="sub">require human review</div>
        </div>
      </div>

      <div className="spacer" />
      <div className="card">
        <h3>Today’s Priority Cases</h3>
        {priorityCases.length === 0 ? (
          <p className="muted">No expedited or high-risk cases in the queue.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Applicant</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Eligibility pre-screen</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {priorityCases.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.id}</strong></td>
                  <td>{c.applicantName}</td>
                  <td>
                    <span className={`badge ${c.priority === 'expedited' ? 'red' : c.priority === 'high' ? 'amber' : 'gray'}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td>{c.queueStatus}</td>
                  <td>{c.eligibility}</td>
                  <td className="right">
                    <Link to={`/summary?case=${c.id}`} className="btn secondary">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="spacer" />
      <div className="disclaimer">
        SNAP AI provides decision support only. Final eligibility decisions remain with authorized agency staff.
      </div>
    </div>
  );
}
