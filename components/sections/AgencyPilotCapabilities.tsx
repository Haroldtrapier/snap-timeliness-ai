import { Icon, type IconName } from "@/components/Icons";

const CARDS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "List",
    title: "Backlog visibility",
    body: "See every case >30 days old, with stage, blocker, and a clear next action. Filter by unit, worker, or applicant population.",
  },
  {
    icon: "Clock",
    title: "Timeliness tracking",
    body: "Federal 30/7-day timeliness rate, average days-to-decide, and trend lines — reported the way your state already reports.",
  },
  {
    icon: "Doc",
    title: "Missing document reduction",
    body: "Applicants and navigators see exactly what your state requires, in plain language, and submit complete packets up front.",
  },
  {
    icon: "Inbox",
    title: "Worker queue support",
    body: "A cleaner queue, sorted by deadline and readiness. Caseworkers spend less time chasing documents and more time on judgment.",
  },
  {
    icon: "ShieldCheck",
    title: "Applicant readiness scoring",
    body: "A transparent score showing how complete a case is before it lands — with the evidence behind every input visible.",
  },
  {
    icon: "User",
    title: "Human-in-the-loop review",
    body: "Every flag, score, and summary is a signal for a caseworker. No auto-decisions. Every applicant retains full appeal rights.",
  },
];

export default function AgencyPilotCapabilities() {
  return (
    <section className="section tight" id="pilot-capabilities" data-screen-label="02 Agency capabilities">
      <div className="shell">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot" />
            For county &amp; state agencies
          </span>
          <h2 className="section-title">
            Built for <em>60–90 day county pilots</em>.
          </h2>
          <p className="section-sub">
            Six capabilities, designed with public benefit teams and ready to deploy under your
            existing policy and procurement frameworks. Configure to your state&apos;s rules; report
            in the formats your auditors already expect.
          </p>
        </div>

        <div className="caps-grid">
          {CARDS.map((c) => {
            const I = Icon[c.icon];
            return (
              <div className="cap-card" key={c.title}>
                <div className="cap-ic">
                  <I />
                </div>
                <h4>{c.title}</h4>
                <p>{c.body}</p>
              </div>
            );
          })}
        </div>

        <div className="caps-footer">
          <div className="caps-footer-copy">
            <div className="mono caps-footer-label">PILOT PROGRAM</div>
            <div className="caps-footer-headline">
              A structured 60–90 day engagement with weekly metrics review.
            </div>
          </div>
          <div className="caps-footer-ctas">
            <a className="btn btn-navy btn-tiny" href="#pilot">
              See the timeline <Icon.Arrow />
            </a>
            <a className="btn btn-ghost btn-tiny" href="#cta">
              Request a pilot
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
