import ApplicantDashboard from "@/components/dashboards/ApplicantDashboard";
import { Icon } from "@/components/Icons";
import { media } from "@/lib/media";
import { Photo } from "@/components/Photo";

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
        <figure className="media-frame section-media">
          <div className="media-fallback" style={{ background: media.applicant.fallback }} />
          <Photo
            local={media.applicant.local}
            cdn={media.applicant.cdn}
            alt={media.applicant.alt}
            width={2400}
            height={1792}
          />
          <div className="media-scrim" aria-hidden="true" />
          <figcaption className="media-chip">
            <Icon.CheckCircle />
            Every notice explained · every deadline tracked
          </figcaption>
        </figure>
        <ApplicantDashboard />
      </div>
    </section>
  );
}
