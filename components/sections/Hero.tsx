import { Icon } from "@/components/Icons";

export default function Hero() {
  return (
    <section className="hero hero-centered" id="top" data-screen-label="01 Hero">
      <div className="shell">
        <div className="hero-stack">
          <span className="eyebrow">
            <span className="dot" />
            <span>For applicants, recipients, navigators &amp; county DSS teams</span>
          </span>
          <h1 className="h1 h1-centered">
            SNAP support for <em>families</em>.
            <br />
            Timeliness intelligence for <em>agencies</em>.
          </h1>
          <p className="sub sub-centered">
            SNAP AI helps applicants, recipients, navigators, and county teams prepare
            documents, explain notices, track deadlines, reduce missing information, and move
            cases forward with human review.
          </p>
          <div className="hero-cta hero-cta-centered">
            <a className="btn btn-primary btn-lg" href="#cta">
              <Icon.Sprout /> Get SNAP Help
            </a>
            <a className="btn btn-navy btn-lg" href="#pilot">
              <Icon.Building /> Request County Pilot
            </a>
          </div>

          <div className="disclaimer disclaimer-centered" role="note">
            <Icon.Info className="ic" />
            <div>
              <b>Guidance and preparation support only.</b> Final eligibility decisions are
              made by your state SNAP agency. SNAP AI does not approve, deny, or replace
              caseworker judgment.
            </div>
          </div>
        </div>

        <div className="hero-proof">
          <div className="proof-card">
            <div className="proof-ic">
              <Icon.Doc />
            </div>
            <h4>Document readiness before submission</h4>
            <p>
              State-specific checklists, legibility checks, and substitute-document guidance —
              so cases arrive complete the first time.
            </p>
            <div className="proof-meta mono">FOR APPLICANTS &amp; NAVIGATORS</div>
          </div>
          <div className="proof-card highlighted">
            <div className="proof-ic">
              <Icon.Calendar />
            </div>
            <h4>Deadline &amp; recertification protection</h4>
            <p>
              The leading cause of lost SNAP benefits is administrative. Reminders at 90, 60,
              30, 14, and 3 days — in 12 languages.
            </p>
            <div className="proof-meta mono">FOR APPLICANTS &amp; RECIPIENTS</div>
          </div>
          <div className="proof-card">
            <div className="proof-ic">
              <Icon.Users />
            </div>
            <h4>Caseworker support, not replacement</h4>
            <p>
              Readiness scores, integrity flags, and timeliness signals — surfaced for human
              review. Caseworkers always decide.
            </p>
            <div className="proof-meta mono">FOR COUNTY &amp; STATE AGENCIES</div>
          </div>
        </div>
      </div>
    </section>
  );
}
