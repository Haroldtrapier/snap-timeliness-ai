import { Icon } from "@/components/Icons";

export default function FinalCTA() {
  return (
    <section className="final-cta" id="cta" data-screen-label="16 Final CTA">
      <div className="shell">
        <span className="eyebrow">
          <span className="dot" />
          Get started
        </span>
        <h2 style={{ marginTop: 20 }}>
          Built for the people doing the work of <em>SNAP</em>.
        </h2>
        <p>
          Whether you&apos;re applying, helping a family apply, or running a county DSS office —
          there&apos;s a place to start here.
        </p>
        <div className="ctas">
          <a className="btn btn-primary btn-lg" href="#">
            <Icon.Sprout /> Get SNAP Help
          </a>
          <a className="btn btn-navy btn-lg" href="#">
            <Icon.Building /> Request Agency Pilot
          </a>
        </div>
        <div className="small">
          Guidance and preparation support only · Final eligibility decisions are made by your
          state SNAP agency
        </div>
      </div>
    </section>
  );
}
