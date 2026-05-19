import { useState } from 'react';
import { useCases } from '../state/CaseStore';
import { evaluateEligibility, ELIGIBILITY_DISCLAIMER } from '../lib/eligibility';

function eligibilityBadge(e: ReturnType<typeof evaluateEligibility>) {
  if (e === 'likely eligible') return <span className="badge green">{e}</span>;
  if (e === 'likely ineligible') return <span className="badge red">{e}</span>;
  if (e === 'expedited review recommended') return <span className="badge amber">{e}</span>;
  return <span className="badge amber">{e}</span>;
}

export default function Eligibility() {
  const { cases } = useCases();
  const [activeId, setActiveId] = useState<string>(cases[0]?.id ?? '');
  const active = cases.find((c) => c.id === activeId);
  if (!active) return <p>No cases available.</p>;

  const result = evaluateEligibility(active);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Eligibility Pre-Screen</h1>
          <p>Rules-based pre-screen against mock SNAP guidelines. Pre-screen results are advisory only.</p>
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
        <h3>{active.id} — {active.applicantName}</h3>
        <div className="grid cols-3">
          <div><label>Household size</label>{active.householdSize}</div>
          <div><label>Monthly income</label>${active.income.toLocaleString()}</div>
          <div><label>Emergency need</label>{active.emergencyNeed ? 'Yes' : 'No'}</div>
        </div>

        <div className="spacer" />
        <h3>Pre-screen result</h3>
        <p style={{ fontSize: '1.1rem' }}>{eligibilityBadge(result)}</p>

        {result === 'expedited review recommended' && (
          <div className="review-banner">Expedited review recommended — federal expedited service rules may apply. Requires human review.</div>
        )}

        <div className="spacer" />
        <div className="disclaimer">{ELIGIBILITY_DISCLAIMER}</div>
      </div>

      <div className="spacer" />
      <div className="card">
        <h3>How the pre-screen works (mock rules)</h3>
        <ul>
          <li>Compares reported monthly income to ~130% Federal Poverty Level guidelines by household size.</li>
          <li>Flags missing required documents as <em>needs more information</em>.</li>
          <li>Routes $0 income or emergency-need cases to <em>expedited review recommended</em>.</li>
          <li>Any high-severity risk flag forces human review before any eligibility determination.</li>
        </ul>
        <p className="muted small">Production deployments calibrate rules to the specific state's SNAP policy (7 CFR Part 273 plus state guidance).</p>
      </div>
    </div>
  );
}
