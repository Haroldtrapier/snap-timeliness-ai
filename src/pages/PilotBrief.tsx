export default function PilotBrief() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pilot Brief</h1>
          <p>A plain-language overview of the SNAP AI pilot for state and county leadership.</p>
        </div>
      </div>

      <div className="card">
        <h3>What SNAP AI does</h3>
        <p>
          SNAP AI is a benefits processing support system. It helps caseworkers move applications
          through review faster by organizing intake data, checking for missing documents, surfacing
          possible inconsistencies, and producing a clear case summary. It is a tool for staff —
          not a replacement for them.
        </p>
      </div>

      <div className="spacer" />
      <div className="grid cols-2">
        <div className="card">
          <h3>Pilot structure</h3>
          <ul>
            <li>60–90 day pilot</li>
            <li>3–5 caseworker users</li>
            <li>Mock resident cases — no real resident data required</li>
            <li>Weekly working sessions with state/county staff</li>
            <li>Outcome review at day 30 and day 60</li>
          </ul>
        </div>
        <div className="card">
          <h3>Human-in-the-loop</h3>
          <ul>
            <li>SNAP AI does not make final benefit decisions</li>
            <li>SNAP AI does not deny benefits automatically</li>
            <li>SNAP AI does not accuse applicants of fraud</li>
            <li>Every high-severity risk indicator is marked <strong>"Requires human review"</strong></li>
            <li>Final eligibility decisions remain with authorized agency staff</li>
          </ul>
        </div>
        <div className="card">
          <h3>Security &amp; privacy</h3>
          <ul>
            <li>Encryption in transit (TLS) and at rest</li>
            <li>Role-based access control (caseworker, supervisor, admin)</li>
            <li>Full audit logs of every case action</li>
            <li>No real resident data in pilot demo</li>
            <li>Privacy posture aligned to federal SNAP confidentiality (7 CFR §272.1(c)) and state requirements</li>
          </ul>
        </div>
        <div className="card">
          <h3>Measurable outcomes</h3>
          <ul>
            <li>Reduced application processing time</li>
            <li>Fewer incomplete applications routed to caseworkers</li>
            <li>Faster document review cycles</li>
            <li>Better fraud/risk indicator surfacing — routed to humans</li>
            <li>Improved caseworker workload visibility for supervisors</li>
          </ul>
        </div>
      </div>

      <div className="spacer" />
      <div className="card">
        <h3>Pilot pricing</h3>
        <p><strong>Pilot cost estimate:</strong> to be finalized based on agency scope.</p>
        <p className="muted small">Final pricing depends on user count, integration scope, and pilot length. SNAP AI is offered as a fixed-fee pilot with no per-decision charges.</p>
      </div>

      <div className="spacer" />
      <div className="card">
        <h3>Phase 2 production features</h3>
        <ul>
          <li>Authenticated single sign-on (SAML/OIDC) and full RBAC</li>
          <li>Secure document storage with virus scanning and PII tokenization</li>
          <li>State-specific eligibility rule packs (7 CFR Part 273 + state addenda)</li>
          <li>Integration with state SNAP case management systems (NCFAST and equivalents)</li>
          <li>Workforce analytics dashboard for supervisors</li>
          <li>Configurable risk-flag library with caseworker feedback loop</li>
          <li>End-to-end audit logging with tamper-evident storage</li>
          <li>Accessibility conformance (WCAG 2.1 AA) and Section 508</li>
          <li>FNS-388 / FNS-388A federal reporting export</li>
          <li>Optional AI-assisted document OCR with human verification gate</li>
        </ul>
      </div>
    </div>
  );
}
