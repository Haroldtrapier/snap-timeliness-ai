import { useMemo, useState } from 'react';
import { useCases } from '../state/CaseStore';
import type { HouseholdMember } from '../types';

export default function Household() {
  const { cases, updateCase } = useCases();
  const [activeId, setActiveId] = useState<string>(cases[0]?.id ?? '');
  const active = cases.find((c) => c.id === activeId);

  const [draft, setDraft] = useState<HouseholdMember>({
    id: '',
    name: '',
    age: 0,
    relationship: 'Child',
    income: 0,
  });

  const unusualPatterns = useMemo(() => {
    if (!active) return [] as string[];
    const issues: string[] = [];

    // Duplicate household members across cases at same address
    const dupChildren = active.householdMembers.flatMap((m) =>
      cases
        .filter((c) => c.id !== active.id && c.address.toLowerCase() === active.address.toLowerCase())
        .filter((c) => c.householdMembers.some((x) => x.name.toLowerCase() === m.name.toLowerCase()))
        .map((c) => `"${m.name}" also listed on ${c.id} (${c.applicantName}) — same address.`),
    );
    issues.push(...dupChildren);

    // Adults with $0 income but employment listed as full-time
    if (active.employmentStatus === 'Full-time' && active.income === 0) {
      issues.push('Full-time employment but $0 monthly income reported.');
    }

    // More than 8 members
    if (active.householdMembers.length > 8) {
      issues.push('Household size exceeds 8 — verify against state household composition rules.');
    }

    return issues;
  }, [active, cases]);

  if (!active) return <p>No cases available.</p>;

  function addMember() {
    if (!active || !draft.name) return;
    const member: HouseholdMember = { ...draft, id: `h${active.householdMembers.length + 1}` };
    updateCase(active.id, {
      householdMembers: [...active.householdMembers, member],
      householdSize: active.householdMembers.length + 1,
    });
    setDraft({ id: '', name: '', age: 0, relationship: 'Child', income: 0 });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Household Members</h1>
          <p>Maintain the household composition for each case. SNAP AI flags unusual patterns for human review.</p>
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

      {unusualPatterns.length > 0 && (
        <div className="review-banner">
          Unusual household patterns detected — Requires human review:
          <ul style={{ margin: '0.3rem 0 0 1rem' }}>
            {unusualPatterns.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
        </div>
      )}

      <div className="spacer" />
      <div className="card">
        <h3>Members on {active.id}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Relationship</th>
              <th>Income</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {active.householdMembers.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.age}</td>
                <td>{m.relationship}</td>
                <td>${m.income.toLocaleString()}</td>
                <td>
                  {m.isStudent && <span className="badge gray">student</span>}{' '}
                  {m.isDisabled && <span className="badge amber">disabled</span>}{' '}
                  {m.isElderly && <span className="badge gray">elderly</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="spacer" />
      <div className="card">
        <h3>Add member</h3>
        <div className="grid cols-3">
          <div>
            <label>Name</label>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <label>Age</label>
            <input type="number" value={draft.age} onChange={(e) => setDraft({ ...draft, age: Number(e.target.value) })} />
          </div>
          <div>
            <label>Relationship</label>
            <select value={draft.relationship} onChange={(e) => setDraft({ ...draft, relationship: e.target.value })}>
              <option>Spouse</option>
              <option>Child</option>
              <option>Parent</option>
              <option>Sibling</option>
              <option>Other dependent</option>
              <option>Unrelated household member</option>
            </select>
          </div>
          <div>
            <label>Income ($)</label>
            <input type="number" value={draft.income} onChange={(e) => setDraft({ ...draft, income: Number(e.target.value) })} />
          </div>
          <div>
            <label>Flags</label>
            <div className="row">
              <label style={{ fontWeight: 400 }}><input type="checkbox" style={{ width: 'auto' }} checked={!!draft.isStudent} onChange={(e) => setDraft({ ...draft, isStudent: e.target.checked })} /> student</label>
              <label style={{ fontWeight: 400 }}><input type="checkbox" style={{ width: 'auto' }} checked={!!draft.isDisabled} onChange={(e) => setDraft({ ...draft, isDisabled: e.target.checked })} /> disabled</label>
              <label style={{ fontWeight: 400 }}><input type="checkbox" style={{ width: 'auto' }} checked={!!draft.isElderly} onChange={(e) => setDraft({ ...draft, isElderly: e.target.checked })} /> elderly</label>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={addMember} disabled={!draft.name}>Add member</button>
          </div>
        </div>
      </div>
    </div>
  );
}
