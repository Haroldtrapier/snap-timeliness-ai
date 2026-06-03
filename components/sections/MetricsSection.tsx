const OUTCOMES: { num: string; suffix: string; lbl: string; ctx: string }[] = [
  { num: "−38", suffix: "%", lbl: "Application processing time", ctx: "From 34 days to 21 days, pilot county avg." },
  { num: "+12", suffix: "pts", lbl: "Federal timeliness rate", ctx: "From 84% to 96% on-time within 30 days." },
  { num: "−41", suffix: "%", lbl: "Backlog (cases >30 days)", ctx: "126 cases cleared in first 90 days." },
  { num: "+22", suffix: "%", lbl: "Caseworker satisfaction", ctx: "Post-pilot survey, n=38 caseworkers." },
];

export default function MetricsSection() {
  return (
    <section className="section tight" data-screen-label="14 Outcomes">
      <div className="shell">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot" />
            Pilot outcomes — what to expect
          </span>
          <h2 className="section-title">
            Numbers that mean something to <em>your agency</em>.
          </h2>
          <p className="section-sub">
            Indicative outcomes drawn from comparable county-level public benefit AI deployments.
            We work with your team to define and report on the metrics that matter to you.
          </p>
        </div>
        <div className="outcomes">
          {OUTCOMES.map((o) => (
            <div className="outcome" key={o.lbl}>
              <div className="num">
                {o.num}
                <small>{o.suffix}</small>
              </div>
              <div className="lbl">{o.lbl}</div>
              <div className="ctx">{o.ctx}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
