import { Icon } from "@/components/Icons";
import { AGENCY_DATA, STAGE_LABELS } from "@/lib/data";

export default function AgencyDashboard() {
  return (
    <div className="preview-frame">
      <div className="preview-window-head">
        <div className="dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="url">snapai.gov · /agency · Riverside County DSS</div>
        <div style={{ width: 30 }} />
      </div>
      <div className="agency">
        <aside className="agency-side" aria-label="Agency console navigation">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true" />
            <div>
              <div>SNAP AI</div>
              <div className="brand-sub" style={{ color: "rgba(255,255,255,0.55)" }}>
                Agency console
              </div>
            </div>
          </div>

          <div className="side-row active">
            <Icon.Grid className="ic" />
            <span>Dashboard</span>
          </div>
          <div className="side-row">
            <Icon.Inbox className="ic" />
            <span>Worker queue</span>
            <span className="pill mono">38</span>
          </div>
          <div className="side-row">
            <Icon.Users className="ic" />
            <span>Client pipeline</span>
            <span className="pill mono">1,847</span>
          </div>
          <div className="side-row">
            <Icon.Doc className="ic" />
            <span>Document review</span>
            <span className="pill mono">214</span>
          </div>
          <div className="side-row">
            <Icon.Flag className="ic" />
            <span>Flags for review</span>
            <span className="pill mono">17</span>
          </div>
          <div className="side-row">
            <Icon.Calendar className="ic" />
            <span>Recertifications</span>
          </div>

          <div className="side-section">Reports</div>
          <div className="side-row">
            <Icon.Clock className="ic" />
            <span>Timeliness</span>
          </div>
          <div className="side-row">
            <Icon.List className="ic" />
            <span>Backlog</span>
          </div>
        </aside>

        <main className="agency-main">
          <div className="agency-topbar">
            <div>
              <h3>Riverside County DSS — caseworker view</h3>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>
                Welcome back, <b style={{ color: "var(--navy)" }}>Jordan Whitman</b> · 14 cases in
                your queue today
              </div>
            </div>
            <div className="actions">
              <div className="pipeline-search">
                <Icon.Search />
                <span>Search cases…</span>
              </div>
              <button type="button" className="btn btn-navy btn-tiny">
                <Icon.Plus /> New intake
              </button>
            </div>
          </div>

          <div className="metrics-row">
            {AGENCY_DATA.metrics.map((m) => (
              <div className="metric" key={m.label}>
                <div className="label mono">{m.label}</div>
                <div className="value">
                  {m.value}
                  {m.suffix && <small>{m.suffix}</small>}
                </div>
                <div className={"delta " + m.dir}>
                  {m.dir === "up" ? "↑" : m.dir === "down" ? "↓" : "·"} {m.delta}
                </div>
              </div>
            ))}
          </div>

          <div className="pipeline-card">
            <div className="head">
              <h4>Client pipeline · sorted by deadline</h4>
              <div className="tools">
                <button type="button" className="chip">
                  <Icon.Filter /> Stage · all
                </button>
                <button type="button" className="chip">
                  <Icon.Filter /> Worker · me
                </button>
              </div>
            </div>
            <div className="pipeline-table" role="table" aria-label="Client pipeline">
              <div className="pipeline-row head-row" role="row">
                <span />
                <span role="columnheader">Client</span>
                <span role="columnheader">Stage</span>
                <span role="columnheader">Readiness</span>
                <span role="columnheader">Deadline</span>
                <span role="columnheader">Timeliness</span>
                <span />
              </div>
              {AGENCY_DATA.clients.map((c) => (
                <div className="pipeline-row" key={c.case} role="row">
                  <span />
                  <div className="client-cell">
                    <div className="avatar" aria-hidden="true">
                      {c.initials}
                    </div>
                    <div className="info">
                      <div className="name">{c.name}</div>
                      <div className="case mono">{c.case}</div>
                    </div>
                  </div>
                  <span className={"stage-pill " + c.stage}>{STAGE_LABELS[c.stage]}</span>
                  <div className={"readiness-mini " + (c.ready < 40 ? "bad" : c.ready < 70 ? "warn" : "")}>
                    <div className="bar">
                      <div style={{ width: c.ready + "%" }} />
                    </div>
                    <div className="pct mono">{c.ready}</div>
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontSize: 12,
                      color: c.deadline === "Overdue" ? "var(--red)" : "var(--ink-2)",
                    }}
                  >
                    {c.deadline}
                  </span>
                  <span className={"timeliness " + c.timeCls}>{c.time}</span>
                  <span aria-hidden="true" style={{ color: "var(--ink-4)" }}>
                    →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
