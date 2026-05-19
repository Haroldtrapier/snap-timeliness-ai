import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCases } from '../state/CaseStore';
import { generateCaseSummary } from '../lib/summary';

export default function Summary() {
  const { cases, setQueueStatus } = useCases();
  const location = useLocation();
  const initialId = new URLSearchParams(location.search).get('case') ?? cases[0]?.id ?? '';
  const [activeId, setActiveId] = useState<string>(initialId);
  const [summary, setSummary] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setSummary('');
    setCopied(false);
    setSent(false);
  }, [activeId]);

  const active = cases.find((c) => c.id === activeId);
  if (!active) return <p>No cases available.</p>;

  function generate() {
    if (!active) return;
    setSummary(generateCaseSummary(active));
  }
  async function copy() {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  function sendToHumanReview() {
    if (!active) return;
    setQueueStatus(active.id, 'risk review');
    setSent(true);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Case Summary</h1>
          <p>One-page caseworker-ready summary. Generated locally from case data — decision support only.</p>
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
        <div className="row">
          <button onClick={generate}>Generate Summary</button>
          <button className="secondary" onClick={copy} disabled={!summary}>
            {copied ? 'Copied' : 'Copy Summary'}
          </button>
          <button className="ghost" onClick={sendToHumanReview}>
            Send to Human Review
          </button>
          {sent && <span className="badge green">Sent to human review queue</span>}
        </div>
        <div className="spacer" />
        {summary ? (
          <pre className="summary-box">{summary}</pre>
        ) : (
          <p className="muted">Click <strong>Generate Summary</strong> to assemble the caseworker brief.</p>
        )}
      </div>
    </div>
  );
}
