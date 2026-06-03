import { Icon } from "@/components/Icons";

const TIMELINE: { when: string; title: string; body: string }[] = [
  {
    when: "WEEK 1–2",
    title: "Configuration & legal",
    body: "DPA, BAA where applicable, SSO setup, role provisioning. Caseworker shadow sessions to map your workflow.",
  },
  {
    when: "WEEK 3–4",
    title: "Staff training & soft launch",
    body: "Two 90-minute training sessions for caseworkers, supervisors, and navigators. Live with a single intake unit.",
  },
  {
    when: "WEEK 5–8",
    title: "Pilot operations",
    body: "Applicant-facing rollout to a defined population. Weekly metrics review with your team.",
  },
  {
    when: "WEEK 9–12",
    title: "Outcomes report & next steps",
    body: "Timeliness, backlog, applicant satisfaction, caseworker time saved. Decision: expand, refine, or sunset.",
  },
];

export default function PilotSection() {
  return (
    <section className="section" id="pilot" data-screen-label="13 Pilot">
      <div className="shell">
        <div className="pilot">
          <div className="pilot-copy" style={{ position: "relative", zIndex: 1 }}>
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: "#6fd687",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              60–90 day county pilot
            </span>
            <h3 style={{ marginTop: 12 }}>
              Run a structured <em>county pilot</em> in one quarter.
            </h3>
            <p>
              Built with public benefit teams who know the realities — tight timelines, fixed
              budgets, federal reporting, and the cost of getting it wrong. We bring the
              technology and the project plan. Your team brings the program expertise.
            </p>
            <div className="ctas">
              <a className="btn btn-primary btn-lg" href="#cta">
                <Icon.Building /> Request Agency Pilot
              </a>
              <a className="btn btn-ghost btn-lg" href="#cta">
                Download pilot one-pager <Icon.ArrowDown />
              </a>
            </div>
          </div>

          <div className="timeline" style={{ position: "relative", zIndex: 1 }}>
            {TIMELINE.map((row) => (
              <div className="timeline-row" key={row.when}>
                <div className="when">{row.when}</div>
                <div className="what">
                  <b>{row.title}</b>
                  <span>{row.body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
