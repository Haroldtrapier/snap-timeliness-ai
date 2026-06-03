const COLUMNS: { heading: string; links: string[] }[] = [
  {
    heading: "For people",
    links: ["Apply for SNAP help", "Notice explainer", "Find a navigator", "Recertification", "Languages"],
  },
  {
    heading: "For agencies",
    links: ["Request a pilot", "Caseworker console", "Backlog reporting", "Integrity flags", "Security & compliance"],
  },
  {
    heading: "Company",
    links: ["About", "Research & methods", "Policy", "Press", "Contact"],
  },
  {
    heading: "Trust",
    links: ["Privacy notice", "Accessibility", "Terms of service", "Status", "Report an issue"],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-grid">
          <div>
            <div className="brand">
              <div className="brand-mark" aria-hidden="true" />
              <div>
                <div>SNAP AI</div>
                <span className="brand-sub">Public benefit AI</span>
              </div>
            </div>
            <p className="footer-tag">
              A platform for SNAP applicants, recipients, navigators, and county and state
              benefits agencies. Built with public benefit teams.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h6>{col.heading}</h6>
              <ul>
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-disclaimer">
          <b>SNAP AI is not a government agency.</b> It is a technology platform that helps
          applicants prepare for and navigate the SNAP application process and helps agencies
          operate more effectively. Final eligibility decisions are made by your state SNAP
          agency under federal and state law. Applicants retain all federal and state appeal
          rights. To apply for SNAP benefits directly, contact your state agency or call 2-1-1.
        </div>

        <div className="footer-bottom">
          <span>© 2026 SNAP AI, Public Benefit Corp.</span>
          <span className="mono">Made for the work of feeding families</span>
        </div>
      </div>
    </footer>
  );
}
