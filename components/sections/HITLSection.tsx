import { Icon } from "@/components/Icons";

const PRINCIPLES: { num: string; bold: string; rest: string }[] = [
  { num: "1", bold: "No auto-decisions.", rest: " Approval and denial are reserved for the state agency." },
  { num: "2", bold: "Reasoning is visible.", rest: " Every flag, score, and summary shows the evidence behind it." },
  { num: "3", bold: "Caseworker override always.", rest: " AI suggestions are dismissible in one click and logged." },
  { num: "4", bold: "Applicant appeal preserved.", rest: " All federal and state appeal rights are unaffected." },
];

export default function HITLSection() {
  return (
    <section className="section tight" id="hitl" data-screen-label="11 Human-in-the-loop">
      <div className="shell">
        <div className="hitl">
          <div className="hitl-copy">
            <span className="eyebrow">
              <span className="dot" />
              Human-in-the-loop
            </span>
            <h3 style={{ marginTop: 16 }}>People decide. AI prepares.</h3>
            <p>
              SNAP eligibility is a legal determination made by a trained caseworker under
              federal and state law. SNAP AI&apos;s job is everything <i>around</i> that decision
              — preparation, organization, explanation, and reminders.
            </p>
            <div className="principles">
              {PRINCIPLES.map((p) => (
                <div className="principle" key={p.num}>
                  <div className="num mono">{p.num}</div>
                  <div className="text">
                    <b>{p.bold}</b>
                    {p.rest}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flow-diagram">
            <div className="flow-step ai">
              <div className="ic">
                <Icon.Sprout />
              </div>
              <div className="what">
                <b>SNAP AI prepares</b>
                <span>Document checklist, readiness score, plain-language explanations</span>
              </div>
            </div>
            <div className="flow-arrow" aria-hidden="true">
              ↓
            </div>
            <div className="flow-step ai">
              <div className="ic">
                <Icon.Flag />
              </div>
              <div className="what">
                <b>SNAP AI surfaces signals</b>
                <span>Flags for review with attached evidence — never decisions</span>
              </div>
            </div>
            <div className="flow-arrow" aria-hidden="true">
              ↓
            </div>
            <div className="flow-step human">
              <div className="ic">
                <Icon.User />
              </div>
              <div className="what">
                <b>Caseworker reviews</b>
                <span>Trained agency staff evaluates evidence under state &amp; federal rules</span>
              </div>
            </div>
            <div className="flow-arrow" aria-hidden="true">
              ↓
            </div>
            <div className="flow-step human">
              <div className="ic">
                <Icon.ShieldCheck />
              </div>
              <div className="what">
                <b>Caseworker decides</b>
                <span>
                  Approval, denial, or further verification — applicant retains all appeal rights
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
