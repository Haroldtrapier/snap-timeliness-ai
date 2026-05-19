import { useState } from 'react';
import { useCases } from '../state/CaseStore';
import type { SnapCase } from '../types';

const BENEFITS = ['SNAP', 'Emergency assistance', 'Medicaid referral', 'TANF referral'];

export default function Intake() {
  const { addCase, cases } = useCases();
  const [form, setForm] = useState({
    applicantName: '',
    address: '',
    county: 'Cumberland',
    householdSize: 1,
    income: 0,
    employmentStatus: 'Full-time',
    benefits: ['SNAP'] as string[],
    emergencyNeed: false,
  });
  const [saved, setSaved] = useState<string | null>(null);

  function toggleBenefit(b: string) {
    setForm((f) => ({
      ...f,
      benefits: f.benefits.includes(b) ? f.benefits.filter((x) => x !== b) : [...f.benefits, b],
    }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = `SNAP-${1000 + cases.length + 1}`;
    const newCase: SnapCase = {
      id,
      applicantName: form.applicantName || 'Unnamed Applicant',
      address: form.address,
      county: form.county,
      householdSize: Number(form.householdSize) || 1,
      income: Number(form.income) || 0,
      employmentStatus: form.employmentStatus,
      benefitsRequested: form.benefits,
      emergencyNeed: form.emergencyNeed,
      householdMembers: [
        {
          id: 'h1',
          name: form.applicantName || 'Unnamed Applicant',
          age: 30,
          relationship: 'Self',
          income: Number(form.income) || 0,
        },
      ],
      documents: [
        { key: 'id', label: 'Government-issued ID', required: true, status: 'missing' },
        { key: 'proof_of_income', label: 'Proof of income', required: true, status: 'missing' },
        { key: 'utility_bill', label: 'Utility bill', required: true, status: 'missing' },
        { key: 'lease_proof', label: 'Lease / rent proof', required: true, status: 'missing' },
        { key: 'ssn_verification', label: 'SSN verification', required: true, status: 'missing' },
        { key: 'child_support_docs', label: 'Child support / dependent documents', required: false, status: 'missing' },
      ],
      riskFlags: [],
      eligibility: form.emergencyNeed || Number(form.income) === 0 ? 'expedited review recommended' : 'needs more information',
      queueStatus: form.emergencyNeed ? 'expedited review' : 'missing documents',
      submittedAt: new Date().toISOString().slice(0, 10),
      priority: form.emergencyNeed ? 'expedited' : 'normal',
    };
    addCase(newCase);
    setSaved(id);
    setForm({
      applicantName: '',
      address: '',
      county: 'Cumberland',
      householdSize: 1,
      income: 0,
      employmentStatus: 'Full-time',
      benefits: ['SNAP'],
      emergencyNeed: false,
    });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Applicant Intake</h1>
          <p>Capture core application data. SNAP AI screens for completeness — final eligibility is determined by agency staff.</p>
        </div>
      </div>

      {saved && (
        <div className="notice">
          Application <strong>{saved}</strong> saved to local case store. Continue with document review.
        </div>
      )}

      <div className="spacer" />
      <form className="card" onSubmit={onSubmit}>
        <div className="grid cols-2">
          <div>
            <label>Applicant name</label>
            <input value={form.applicantName} onChange={(e) => setForm({ ...form, applicantName: e.target.value })} required />
          </div>
          <div>
            <label>Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </div>
          <div>
            <label>County</label>
            <input value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} />
          </div>
          <div>
            <label>Household size</label>
            <input type="number" min={1} value={form.householdSize} onChange={(e) => setForm({ ...form, householdSize: Number(e.target.value) })} />
          </div>
          <div>
            <label>Monthly income ($)</label>
            <input type="number" min={0} value={form.income} onChange={(e) => setForm({ ...form, income: Number(e.target.value) })} />
          </div>
          <div>
            <label>Employment status</label>
            <select value={form.employmentStatus} onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Self-employed</option>
              <option>Unemployed</option>
              <option>Retired</option>
              <option>Student</option>
              <option>Disabled</option>
            </select>
          </div>
        </div>

        <div className="spacer" />
        <label>Benefits requested</label>
        <div className="row">
          {BENEFITS.map((b) => (
            <label key={b} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 400 }}>
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={form.benefits.includes(b)}
                onChange={() => toggleBenefit(b)}
              />
              {b}
            </label>
          ))}
        </div>

        <div className="spacer" />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400 }}>
          <input
            type="checkbox"
            style={{ width: 'auto' }}
            checked={form.emergencyNeed}
            onChange={(e) => setForm({ ...form, emergencyNeed: e.target.checked })}
          />
          Emergency / expedited need (e.g., homeless, zero income, migrant/seasonal worker)
        </label>

        <div className="spacer" />
        <div className="row">
          <button type="submit">Save application</button>
          <span className="muted small">Saves to local demo state — no real resident data used.</span>
        </div>
      </form>
    </div>
  );
}
