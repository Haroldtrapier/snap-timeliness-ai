import { Icon } from "@/components/Icons";

export default function NoticeExplainer() {
  return (
    <div className="preview-frame">
      <div className="preview-window-head">
        <div className="dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="url">snapai.gov · /notice-explainer</div>
        <div style={{ width: 30 }} />
      </div>
      <div className="notice">
        <div className="notice-left">
          <div className="upload">
            <div className="ic">
              <Icon.Doc />
            </div>
            <div>
              <div style={{ color: "var(--navy)", fontSize: 13.5, fontWeight: 500 }}>
                NOA-2026-487291.pdf
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-4)" }}>4 pages · uploaded today</div>
            </div>
            <div className="ok mono">
              <Icon.Check /> Parsed
            </div>
          </div>

          <div className="notice-paper">
            <div className="agency">
              <div className="seal" aria-hidden="true">
                DSS
              </div>
              <div className="info">
                <b>Department of Social Services</b>
                <span>Notice of Action · Form NOA-S-1</span>
              </div>
            </div>
            <div className="subject">SUBJECT: REQUEST FOR ADDITIONAL VERIFICATION</div>
            <div className="meta-grid">
              <b>Case:</b>
              <span>SNAP-2026-08471</span>
              <b>Date issued:</b>
              <span>May 12, 2026</span>
              <b>Reply by:</b>
              <span>May 22, 2026</span>
              <b>Caseworker:</b>
              <span>J. Whitman</span>
            </div>
            <p>
              Pursuant to 7 C.F.R. § 273.2(f), your application for Supplemental Nutrition
              Assistance Program benefits is pending receipt of verification of household earned
              income for the period of April 14, 2026 through May 13, 2026.
            </p>
            <div className="legalese">
              Failure to furnish requested verification within ten (10) calendar days of receipt
              of this notice may result in denial of your application or termination of benefits,
              in accordance with state and federal regulations.
            </div>
            <p>
              Acceptable verification includes: payroll stubs, an employer statement letter, tax
              records (Form W-2 or 1099), or a signed Form DSS-INC-12.
            </p>
            <p style={{ color: "var(--ink-4)", marginTop: 12 }}>— page 1 of 4 —</p>
          </div>
        </div>

        <div className="notice-right">
          <div className="urgency high mono">High urgency · 6 days left</div>

          <p className="plain-summary">
            Your county needs <em>proof of income</em> from the last month, or your SNAP
            application could be denied. Send it by <em>May 22</em>.
          </p>

          <div className="notice-fields">
            <div className="notice-field">
              <div className="k">DEADLINE</div>
              <div className="v">May 22, 2026</div>
            </div>
            <div className="notice-field">
              <div className="k">REQUIRED ACTION</div>
              <div className="v">Send income verification</div>
            </div>
            <div className="notice-field">
              <div className="k">CASE</div>
              <div className="v">SNAP-2026-08471</div>
            </div>
            <div className="notice-field">
              <div className="k">CONTACT</div>
              <div className="v">J. Whitman, caseworker</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary btn-tiny">
              <Icon.Upload /> Upload pay stubs
            </button>
            <button type="button" className="btn btn-ghost btn-tiny">
              <Icon.Translate /> Translate to Spanish
            </button>
            <button type="button" className="btn btn-ghost btn-tiny">
              <Icon.Phone /> Call caseworker
            </button>
          </div>

          <div className="notice-questions">
            <div className="head">Questions to ask your caseworker</div>
            <ul>
              <li>Can I submit pay stubs from two different jobs together?</li>
              <li>What if my employer is slow to provide a letter?</li>
              <li>Will my interview still happen on May 24 if I send this by Friday?</li>
              <li>Does childcare cost reduce the income that counts?</li>
            </ul>
          </div>

          <div
            style={{
              padding: "10px 14px",
              background: "var(--info-soft)",
              border: "1px solid var(--info-ring)",
              borderRadius: 8,
              fontSize: 12.5,
              color: "var(--navy-2)",
              lineHeight: 1.5,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <Icon.Info style={{ color: "var(--info)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <b>This is guidance, not legal advice.</b> Your caseworker makes the final decision
              about your case.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
