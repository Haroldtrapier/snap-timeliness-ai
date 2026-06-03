import { Icon, type IconName } from "@/components/Icons";

const PERSONAS: { role: string; title: string; desc: string; icon: IconName }[] = [
  {
    role: "APPLICANT",
    title: "Households applying for SNAP",
    desc: "Step-by-step guidance, document checklists, deadline reminders, and plain-language explanations of every notice you receive.",
    icon: "Heart",
  },
  {
    role: "RECIPIENT",
    title: "Current SNAP recipients",
    desc: "Stay on top of recertification, report changes, and keep benefits without interruption — in your language, at your pace.",
    icon: "Refresh",
  },
  {
    role: "NAVIGATOR",
    title: "Benefits navigators & nonprofits",
    desc: "A shared workspace for community navigators and food bank staff supporting families through the SNAP process.",
    icon: "Hand",
  },
  {
    role: "CASEWORKER",
    title: "County DSS caseworkers",
    desc: "Document readiness, timeliness signals, and integrity flags — surfaced before a case lands in your queue.",
    icon: "Briefcase",
  },
  {
    role: "AGENCY",
    title: "State & county agencies",
    desc: "Backlog visibility, timeliness reporting, and human-in-the-loop AI built for the realities of public benefit work.",
    icon: "Building",
  },
];

export default function WhoWeHelp() {
  return (
    <section className="section tight" id="who" data-screen-label="03 Who we help">
      <div className="shell">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot" />
            Who SNAP AI helps
          </span>
          <h2 className="section-title">
            One platform. Built for <em>everyone in the SNAP process</em>.
          </h2>
          <p className="section-sub">
            From the family applying for the first time to the caseworker reviewing a
            30-day-old case, SNAP AI gives each person what they need — and nothing they
            don&apos;t.
          </p>
        </div>

        <div className="who-grid">
          {PERSONAS.map((p) => {
            const I = Icon[p.icon];
            return (
              <div className="who-card" key={p.role}>
                <div className="who-ic">
                  <I />
                </div>
                <div className="role mono">{p.role}</div>
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
