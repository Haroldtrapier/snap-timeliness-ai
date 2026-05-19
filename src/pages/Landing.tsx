import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div>
      <section className="hero">
        <h1>SNAP AI</h1>
        <p>
          An AI-powered support system for SNAP caseworkers. SNAP AI organizes intake data,
          reviews uploaded documents, flags missing or inconsistent information, and helps
          route final decisions to human review — so eligibility staff spend less time on
          paperwork and more time on residents.
        </p>
        <Link to="/dashboard" className="btn">Enter Caseworker Demo →</Link>
      </section>

      <div className="spacer" />
      <div className="grid cols-3 feature-grid">
        <div className="card">
          <h4>Faster intake</h4>
          <p>Structured applicant intake with automatic completeness checks before a caseworker ever opens the file.</p>
        </div>
        <div className="card">
          <h4>Document review</h4>
          <p>Required-document checklist, mismatch detection, and human-in-the-loop review for anything unusual.</p>
        </div>
        <div className="card">
          <h4>Risk indicators</h4>
          <p>Surfaces possible inconsistencies — never accuses applicants of fraud, never auto-denies benefits.</p>
        </div>
        <div className="card">
          <h4>Eligibility pre-screen</h4>
          <p>Rules-based pre-screen against SNAP guidelines to help caseworkers prioritize their queue.</p>
        </div>
        <div className="card">
          <h4>AI case summary</h4>
          <p>One-page caseworker-ready summary with documents received, missing items, flags, and next action.</p>
        </div>
        <div className="card">
          <h4>Human-in-the-loop</h4>
          <p>Every final decision routes to authorized agency staff. SNAP AI is decision support, not a decision maker.</p>
        </div>
      </div>

      <div className="spacer" />
      <div className="notice">
        Pilot-ready: 60–90 day pilot, 3–5 staff users, mock resident cases for the demo.
        No real resident data is used in this build.
      </div>
    </div>
  );
}
