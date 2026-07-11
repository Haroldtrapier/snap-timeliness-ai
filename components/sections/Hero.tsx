import { Icon } from "@/components/Icons";
import { getMessages } from "@/lib/i18n";
import { media } from "@/lib/media";
import { Photo } from "@/components/Photo";

export default async function Hero() {
  const m = await getMessages();
  return (
    <section className="hero hero-centered" id="top" data-screen-label="01 Hero">
      <div className="shell">
        <div className="hero-stack">
          <span className="eyebrow">
            <span className="dot" />
            <span>{m.hero.eyebrow}</span>
          </span>
          <h1 className="h1 h1-centered">
            {m.hero.titlePre} <em>{m.hero.titleEm1}</em>.
            <br />
            {m.hero.titleMid} <em>{m.hero.titleEm2}</em>.
          </h1>
          <p className="sub sub-centered">{m.hero.sub}</p>
          <div className="hero-cta hero-cta-centered">
            <a className="btn btn-primary btn-lg" href="#cta">
              <Icon.Sprout /> {m.hero.getHelp}
            </a>
            <a className="btn btn-navy btn-lg" href="#pilot">
              <Icon.Building /> {m.hero.requestPilot}
            </a>
          </div>

          <div className="disclaimer disclaimer-centered" role="note">
            <Icon.Info className="ic" />
            <div>
              <b>{m.hero.disclaimerBold}</b> {m.hero.disclaimerRest}
            </div>
          </div>
        </div>

        <figure className="media-frame hero-media">
          <div className="media-fallback" style={{ background: media.hero.fallback }} />
          <Photo
            local={media.hero.local}
            cdn={media.hero.cdn}
            alt={media.hero.alt}
            width={2752}
            height={1536}
            loading="eager"
          />
          <div className="media-scrim" aria-hidden="true" />
          <figcaption className="media-chip">
            <Icon.Sprout />
            Preparing families for a complete, on-time SNAP application
          </figcaption>
        </figure>

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
