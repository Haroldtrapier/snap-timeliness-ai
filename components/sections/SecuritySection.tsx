import { Icon, type IconName } from "@/components/Icons";

interface SecurityCard {
  icon: IconName;
  title: string;
  body: string;
  bullets: string[];
}

const CARDS: SecurityCard[] = [
  {
    icon: "Lock",
    title: "Encryption & access",
    body: "End-to-end encryption in transit and at rest. Per-agency keys with role-based access for caseworkers, navigators, and administrators.",
    bullets: ["TLS 1.3 · AES-256", "SSO · SAML · SCIM", "Audit log on every record"],
  },
  {
    icon: "Shield",
    title: "Compliance posture",
    body: "Aligned with federal requirements for SNAP system operators and partners, with the certifications agencies expect from production vendors.",
    bullets: ["SOC 2 Type II in progress", "FNS-906 alignment", "StateRAMP roadmap"],
  },
  {
    icon: "User",
    title: "Applicant data dignity",
    body: "Applicants own their data. Records are retained per your state's policy and deleted on request. We do not sell, monetize, or train models on applicant data.",
    bullets: ["No third-party data sharing", "No model training on PII", "Plain-language consent"],
  },
];

const BADGES = ["SOC 2 Type II", "FNS-906", "StateRAMP", "WCAG 2.1 AA", "NIST 800-53", "CJIS-ready"];

export default function SecuritySection() {
  return (
    <section className="section tight" id="security" data-screen-label="12 Security">
      <div className="shell">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot" />
            Security &amp; privacy
          </span>
          <h2 className="section-title">
            Built for the trust required of <em>public benefit</em> work.
          </h2>
          <p className="section-sub">
            We follow federal and state requirements for personally identifiable information and
            protected benefit data. No training on applicant data — ever.
          </p>
        </div>

        <div className="security">
          {CARDS.map((card) => {
            const I = Icon[card.icon];
            return (
              <div className="security-card" key={card.title}>
                <div className="ic">
                  <I />
                </div>
                <h4>{card.title}</h4>
                <p>{card.body}</p>
                <ul>
                  {card.bullets.map((b) => (
                    <li key={b}>
                      <Icon.Check /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="compliance-row">
          <div className="lbl">Compliance &amp; standards</div>
          <div className="badges">
            {BADGES.map((b) => (
              <span className="compliance-badge" key={b}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
