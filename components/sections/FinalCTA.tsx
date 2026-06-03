import { Icon } from "@/components/Icons";
import { getMessages } from "@/lib/i18n";

export default async function FinalCTA() {
  const m = await getMessages();
  return (
    <section className="final-cta" id="cta" data-screen-label="16 Final CTA">
      <div className="shell">
        <span className="eyebrow">
          <span className="dot" />
          {m.finalCta.eyebrow}
        </span>
        <h2 style={{ marginTop: 20 }}>
          {m.finalCta.titlePre} <em>{m.finalCta.titleEm}</em>.
        </h2>
        <p>{m.finalCta.sub}</p>
        <div className="ctas">
          <a className="btn btn-primary btn-lg" href="#">
            <Icon.Sprout /> {m.finalCta.getHelp}
          </a>
          <a className="btn btn-navy btn-lg" href="#">
            <Icon.Building /> {m.finalCta.requestPilot}
          </a>
        </div>
        <div className="small">{m.finalCta.small}</div>
      </div>
    </section>
  );
}
