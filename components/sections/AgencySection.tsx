import AgencyDashboard from "@/components/dashboards/AgencyDashboard";
import { Icon } from "@/components/Icons";
import { media } from "@/lib/media";

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
        <figure className="media-frame section-media">
          <div className="media-fallback" style={{ background: media.agency.fallback }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={media.agency.min} alt={media.agency.alt} width={2400} height={1792} loading="lazy" />
          <div className="media-scrim" aria-hidden="true" />
          <figcaption className="media-chip">
            <Icon.ShieldCheck />
            Human-in-the-loop · caseworkers always decide
          </figcaption>
        </figure>
        <AgencyDashboard />
      </div>
    </section>
  );
}
