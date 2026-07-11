import { media } from "@/lib/media";

const STATS: { num: string; accent?: string; lbl: string }[] = [
  { num: "30", accent: "-day", lbl: "Federal timeliness standard SNAP AI is built to protect" },
  { num: "12", lbl: "Languages for notices, checklists, and deadline reminders" },
  { num: "5", lbl: "Reminder touchpoints — 90, 60, 30, 14 & 3 days out" },
  { num: "100", accent: "%", lbl: "Decisions reviewed by a caseworker — AI never approves or denies" },
];

// Full-width civic trust statement with generated government-building imagery.
export default function TrustBand() {
  return (
    <section className="trust-band" data-screen-label="13 Trust">
      <div className="trust-bg" aria-hidden="true" style={{ background: media.civic.fallback }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.civic.min} alt="" width={2752} height={1536} loading="lazy" />
      </div>
      <div className="shell">
        <div className="trust-inner">
          <span className="eyebrow">
            <span className="dot" />
            Built for public trust
          </span>
          <h2>
            Public benefits are a promise. We help agencies <em>keep it — on time</em>.
          </h2>
          <p className="trust-lead">
            SNAP AI is accountable to the same standards as the agencies it serves: federal
            timeliness rules, plain-language access, and a hard line that keeps eligibility
            decisions in human hands.
          </p>

          <div className="trust-stats">
            {STATS.map((s) => (
              <div className="trust-stat" key={s.lbl}>
                <div className="num">
                  {s.num}
                  {s.accent ? <span>{s.accent}</span> : null}
                </div>
                <div className="lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
