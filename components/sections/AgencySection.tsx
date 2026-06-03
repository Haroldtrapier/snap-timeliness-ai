import AgencyDashboard from "@/components/dashboards/AgencyDashboard";

export default function AgencySection() {
  return (
    <section className="section" id="agency" data-screen-label="09 Agency dashboard">
      <div className="shell">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot" />
            For agencies &amp; navigators
          </span>
          <h2 className="section-title">
            Caseworker support — not <em>caseworker replacement</em>.
          </h2>
          <p className="section-sub">
            Backlog visibility, timeliness signals, document readiness, and a clean pipeline
            view. Built with caseworkers, navigators, and county DSS leadership.
          </p>
        </div>
        <AgencyDashboard />
      </div>
    </section>
  );
}
