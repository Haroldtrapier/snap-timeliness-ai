import ApplicantDashboard from "@/components/dashboards/ApplicantDashboard";

export default function ApplicantSection() {
  return (
    <section className="section" id="applicant" data-screen-label="05 Applicant dashboard">
      <div className="shell">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot" />
            For applicants
          </span>
          <h2 className="section-title">
            Know exactly where you stand — and <em>what to do next</em>.
          </h2>
          <p className="section-sub">
            Application stage, readiness score, required documents, deadlines, and a suggested
            next step. Everything an applicant needs in one calm view.
          </p>
        </div>
        <ApplicantDashboard />
      </div>
    </section>
  );
}
