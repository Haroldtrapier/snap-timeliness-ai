import { Icon } from "@/components/Icons";

const DOCS: { name: string; status: "ok" | "missing" | "pending"; note: string }[] = [
  { name: "Photo ID — Driver's license", status: "ok", note: "Clear · expires 2029" },
  { name: "SSN cards (4 of 4)", status: "ok", note: "All legible" },
  { name: "Lease agreement", status: "ok", note: "Signed by landlord" },
  { name: "Pay stubs — 30 days", status: "missing", note: "0 of 2 uploaded" },
  { name: "Childcare statement", status: "missing", note: "Daycare letter accepted" },
  { name: "Utility bill (heating)", status: "pending", note: "Auto-import requested" },
  { name: "Bank statement — last 30 days", status: "ok", note: "Optional but helpful" },
];

const ICON_CLASS = { ok: "done", missing: "missing", pending: "pending" } as const;

export default function ChecklistSection() {
  return (
    <section className="section tight" id="checklist" data-screen-label="07 Document checklist">
      <div className="shell">
        <div className="split">
          <div className="split-copy">
            <span className="eyebrow">
              <span className="dot" />
              Document checklist &amp; readiness review
            </span>
            <h3 style={{ marginTop: 16 }}>
              Know what to gather <em>before</em> your case sits in a queue.
            </h3>
            <p>
              SNAP AI generates a tailored document checklist from your household profile and
              your state&apos;s SNAP requirements. Upload as you go — every document is reviewed
              for legibility and completeness before submission.
            </p>
            <ul>
              <li>
                <Icon.Check />
                <span>
                  <b>State-specific.</b> Rules vary by state — we cover all 53 SNAP-administering
                  agencies, updated as policy changes.
                </span>
              </li>
              <li>
                <Icon.Check />
                <span>
                  <b>Readability review.</b> Blurry pay stub? Missing page? We flag it before
                  your caseworker has to.
                </span>
              </li>
              <li>
                <Icon.Check />
                <span>
                  <b>Substitute suggestions.</b> Don&apos;t have a pay stub? We list the
                  acceptable alternatives your state allows.
                </span>
              </li>
              <li>
                <Icon.Check />
                <span>
                  <b>Caseworker-ready packets.</b> Submit a clean, organized bundle — or share
                  with your navigator.
                </span>
              </li>
            </ul>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div className="card-title">
              <span>Your document packet</span>
              <span className="meta">Riverside County · CA</span>
            </div>
            <div className="doclist">
              {DOCS.map((doc) => (
                <div className="doc-row" key={doc.name}>
                  <div className={"icon " + ICON_CLASS[doc.status]} aria-hidden="true">
                    {doc.status === "ok" ? "✓" : doc.status === "missing" ? "!" : "…"}
                  </div>
                  <div className="name">{doc.name}</div>
                  <div
                    className={
                      "status " + (doc.status === "ok" ? "ok" : doc.status === "missing" ? "warn" : "")
                    }
                  >
                    {doc.note}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                background: "var(--green-soft)",
                border: "1px solid var(--green-ring)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--green-deep)",
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <Icon.ShieldCheck style={{ color: "var(--green-2)", flexShrink: 0 }} />
              <div>
                <b>5 of 7 ready.</b> Two more documents and your packet is caseworker-ready.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
