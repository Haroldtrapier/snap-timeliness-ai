import { Icon } from "@/components/Icons";
import { APPLICANT_DATA, STAGES, type DocStatus } from "@/lib/data";

function Donut({ value, size = 88, stroke = 10 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * (value / 100);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Readiness score: ${value} out of 100`}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--green)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

function docIcon(status: DocStatus) {
  if (status === "ok") return <Icon.Check />;
  if (status === "missing") return "!";
  return "…";
}

const ICON_CLASS: Record<DocStatus, string> = {
  ok: "done",
  missing: "missing",
  pending: "pending",
};

export default function ApplicantDashboard({ compact = false }: { compact?: boolean }) {
  const d = APPLICANT_DATA.applicant;
  return (
    <div className="preview-frame">
      <div className="preview-window-head">
        <div className="dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="url">snapai.gov · /applicant/dashboard</div>
        <div style={{ width: 30 }} />
      </div>
      <div className="applicant">
        <aside className="applicant-side" aria-label="Applicant navigation">
          <div className="who-block">
            <div className="avatar" aria-hidden="true">
              {d.initials}
            </div>
            <div className="name">{d.name}</div>
            <div className="case mono">{d.case}</div>
          </div>
          <div className="side-row active">
            <Icon.Home className="ic" />
            <span>My SNAP application</span>
          </div>
          <div className="side-row">
            <Icon.Doc className="ic" />
            <span>Documents</span>
            <span className="pill mono">2 missing</span>
          </div>
          <div className="side-row">
            <Icon.Calendar className="ic" />
            <span>Deadlines</span>
          </div>
          <div className="side-row">
            <Icon.Chat className="ic" />
            <span>Ask a question</span>
          </div>
          <div className="side-row">
            <Icon.Mail className="ic" />
            <span>Notices</span>
            <span className="pill mono">1</span>
          </div>
          <div className="side-section">Resources</div>
          <div className="side-row">
            <Icon.Map className="ic" />
            <span>Find a navigator</span>
          </div>
          <div className="side-row">
            <Icon.Phone className="ic" />
            <span>Call my county</span>
          </div>
        </aside>

        <main className="applicant-main">
          <div>
            <div className="card-title">
              <span>Application stage</span>
              <span className="meta">Submitted May 9, 2026 · Day 7 of 30</span>
            </div>
            <ol className="stage-bar" style={{ marginTop: 12 }} aria-label="Application stage tracker">
              {STAGES.map((s, i) => {
                const done = i < d.stage;
                const current = i === d.stage;
                return (
                  <li
                    key={s}
                    className={"stage-item " + (done ? "done" : current ? "current" : "")}
                    aria-current={current ? "step" : undefined}
                  >
                    {done && "✓ "}
                    {s}
                    {done && <span className="sr-only"> (completed)</span>}
                    {current && <span className="sr-only"> (current)</span>}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="app-grid">
            <div className="card">
              <div className="card-title">
                <span>SNAP readiness score</span>
                <span className="meta">Guidance only</span>
              </div>
              <div className="readiness">
                <div className="donut">
                  <Donut value={d.readiness} />
                  <div className="num" aria-hidden="true">
                    {d.readiness}
                    <small>READY</small>
                  </div>
                </div>
                <div className="copy">
                  <div className="label">What this means</div>
                  <div className="summary">
                    Your application is mostly complete. Two documents would strengthen it. A
                    caseworker will make the final decision.
                  </div>
                </div>
              </div>
            </div>

            <div className="next-step">
              <div className="ic">
                <Icon.Bolt />
              </div>
              <div className="copy">
                <div className="label">SUGGESTED NEXT STEP</div>
                <div className="what">{d.nextStep.what}</div>
                <div className="why">{d.nextStep.why}</div>
              </div>
              <button type="button">Upload</button>
            </div>
          </div>

          {!compact && (
            <div className="app-grid">
              <div className="card">
                <div className="card-title">
                  <span>Required documents</span>
                  <span className="meta">4 of 6 complete</span>
                </div>
                <div className="doclist">
                  {d.documents.map((doc) => (
                    <div className="doc-row" key={doc.name}>
                      <div className={"icon " + ICON_CLASS[doc.status]} aria-hidden="true">
                        {docIcon(doc.status)}
                      </div>
                      <div className="name">{doc.name}</div>
                      <div
                        className={
                          "status " + (doc.status === "ok" ? "ok" : doc.status === "missing" ? "warn" : "")
                        }
                      >
                        {doc.note}
                      </div>
                      {doc.status === "missing" && (
                        <button type="button" className="action">
                          Upload<span className="sr-only"> {doc.name}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-title">
                  <span>Upcoming deadlines</span>
                  <span className="meta">Next 30 days</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  {d.deadlines.map((dl) => (
                    <div className={"deadline-row " + (dl.badge === "urgent" ? "urgent" : "")} key={dl.what}>
                      <div className="date">
                        <div className="m mono">{dl.m}</div>
                        <div className="d">{dl.d}</div>
                      </div>
                      <div className="info">
                        <div className="what">{dl.what}</div>
                        <div className="when">{dl.when}</div>
                      </div>
                      <span className={"badge " + dl.badge}>{dl.badge}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
