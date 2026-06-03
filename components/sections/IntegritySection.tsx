import { Icon, type IconName } from "@/components/Icons";

interface Flag {
  sev: "review" | "attention";
  color: "info" | "navy" | "amber" | "red";
  icon: IconName;
  title: string;
  body: string;
  action: string;
}

const FLAGS: Flag[] = [
  {
    sev: "review",
    color: "info",
    icon: "Identity",
    title: "Identity consistency",
    body: "Document names, dates of birth, and SSNs are cross-checked. Any inconsistency is surfaced for a human reviewer — never auto-rejected.",
    action: "Send to caseworker",
  },
  {
    sev: "review",
    color: "navy",
    icon: "Users",
    title: "Household validation",
    body: "Listed members verified against the supporting documents on file. Caseworker can request additional verification or accept as-is.",
    action: "Open household review",
  },
  {
    sev: "attention",
    color: "amber",
    icon: "Doc",
    title: "Missing information",
    body: "Required fields, signatures, or documents not yet provided. Marked for follow-up — not denial.",
    action: "Request from applicant",
  },
  {
    sev: "review",
    color: "navy",
    icon: "Refresh",
    title: "Duplicate case signals",
    body: "Possible overlap with an existing or recent application in the same household. Flagged for caseworker review per state policy.",
    action: "Compare cases",
  },
  {
    sev: "attention",
    color: "amber",
    icon: "Eye",
    title: "Unclear document image",
    body: "Blurry, cropped, or unreadable upload detected. Applicant prompted to resubmit before submission to caseworker.",
    action: "Request re-upload",
  },
  {
    sev: "review",
    color: "navy",
    icon: "Shield",
    title: "Child identity misuse risk",
    body: "Indicators of a child's identity being misused on an adult application. Always routed to a senior caseworker for human review.",
    action: "Escalate for review",
  },
];

export default function IntegritySection() {
  return (
    <section className="section tight" id="integrity" data-screen-label="10 Integrity">
      <div className="shell">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot" />
            Program integrity
          </span>
          <h2 className="section-title">
            Flags for <em>review</em>, not fraud decisions.
          </h2>
          <p className="section-sub">
            Caseworkers see clear, plain-language signals that warrant a second look — with the
            underlying evidence attached. SNAP AI never denies, never auto-rejects, and never
            makes the final call.
          </p>
        </div>

        <div className="flags-grid">
          {FLAGS.map((f) => {
            const I = Icon[f.icon];
            return (
              <div className="flag-card" key={f.title}>
                <div className="top">
                  <div className={"ic " + f.color}>
                    <I />
                  </div>
                  <span className={"severity " + f.sev}>
                    {f.sev === "review" ? "For review" : "Needs attention"}
                  </span>
                </div>
                <h4>{f.title}</h4>
                <p>{f.body}</p>
                <div className="footer-line">
                  <span className="who">Routed to: caseworker</span>
                  <span className="action">{f.action} →</span>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 24,
            padding: "18px 22px",
            background: "var(--info-soft)",
            border: "1px solid var(--info-ring)",
            borderLeft: "4px solid var(--info)",
            borderRadius: 8,
            display: "flex",
            gap: 14,
            fontSize: 14,
            color: "var(--navy-2)",
            lineHeight: 1.55,
            maxWidth: 880,
          }}
        >
          <Icon.Scale style={{ color: "var(--info)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <b>SNAP AI does not make fraud determinations.</b> Every flag is a signal for human
            review under your state&apos;s existing integrity process — with the underlying
            documents and reasoning attached. Caseworkers make every decision.
          </div>
        </div>
      </div>
    </section>
  );
}
