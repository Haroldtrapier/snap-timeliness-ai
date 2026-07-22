import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getFinancialProfile, getLatestEstimate, EMPTY_PROFILE } from "@/lib/prescreen";
import { runPrescreen } from "./actions";

export const metadata: Metadata = {
  title: "Eligibility pre-screen · SNAP AI",
};

const dollars = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const field = (c: number) => (c > 0 ? (c / 100).toString() : "");

export default async function PrescreenPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  if (!isSupabaseConfigured || session.id === "demo") {
    return (
      <div className="app-surface">
        <div className="section-head">
          <h1 className="section-title">Eligibility pre-screen</h1>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: 0, color: "var(--ink-2)" }}>
            The eligibility pre-screen is available when signed in with a real account.
          </p>
        </div>
      </div>
    );
  }

  const [profile, estimate] = await Promise.all([
    getFinancialProfile(session.id),
    getLatestEstimate(session.id),
  ]);
  const p = profile ?? EMPTY_PROFILE;

  return (
    <div className="app-surface">
      <div className="section-head">
        <h1 className="section-title">Eligibility pre-screen</h1>
        <p className="section-sub">
          Enter your household finances to see whether you may qualify and an estimated monthly
          benefit. This is a <strong>pre-screening estimate, not a decision</strong> — only your
          state SNAP agency can determine eligibility.
        </p>
      </div>

      {ok && (
        <div className="auth-info" role="status">
          Estimate updated below.
        </div>
      )}
      {error && (
        <div className="auth-error" role="alert">
          {error === "demo"
            ? "Pre-screening needs a real account."
            : "Something went wrong saving your details. Please try again."}
        </div>
      )}

      {estimate && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>
              {estimate.likelyEligible ? "You may qualify" : "You may not qualify"}
            </h2>
            {estimate.likelyEligible && (
              <span style={{ fontSize: 26, fontWeight: 700 }}>
                ≈ {dollars(estimate.estimatedMonthlyBenefitCents)}/month
              </span>
            )}
            {estimate.expedited && (
              <span
                className="pill"
                style={{ background: "var(--warn-bg, #fef3c7)", color: "var(--warn-ink, #92400e)" }}
              >
                May qualify for 7-day expedited processing
              </span>
            )}
          </div>

          <ul style={{ margin: "14px 0 0", paddingLeft: 18, color: "var(--ink-2)", lineHeight: 1.7 }}>
            <li>
              Gross monthly income counted: <strong>{dollars(estimate.grossIncomeCents)}</strong>
              {" · "}gross test {estimate.grossTestPass ? "passed" : "not passed"}
            </li>
            <li>
              Net income after deductions: <strong>{dollars(estimate.netIncomeCents)}</strong>
              {" · "}net test {estimate.netTestPass ? "passed" : "not passed"}
            </li>
            {estimate.categoricallyEligible && (
              <li>Your household appears categorically eligible under North Carolina&apos;s 200% rule.</li>
            )}
          </ul>

          <details style={{ marginTop: 14 }}>
            <summary style={{ cursor: "pointer", color: "var(--ink-2)" }}>
              How this was calculated (step by step)
            </summary>
            <ol style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--ink-2)", lineHeight: 1.7 }}>
              {estimate.ruleTrace.map((t) => (
                <li key={t.step}>
                  {t.description}: <strong>{String(t.result)}</strong>
                </li>
              ))}
            </ol>
            <p style={{ color: "var(--ink-3, var(--ink-2))", fontSize: 13 }}>
              Policy version {estimate.policyVersion} · computed{" "}
              {new Date(estimate.computedAt).toLocaleDateString("en-US")}
            </p>
          </details>

          <p style={{ marginTop: 14, marginBottom: 0, fontSize: 13, color: "var(--ink-2)" }}>
            {estimate.disclaimer}
          </p>
        </div>
      )}

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Your household finances (monthly)</h2>
        <form className="auth-form" action={runPrescreen}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <label className="auth-field">
              <span>Income from work (before taxes)</span>
              <input type="number" name="earned_income" min={0} step="0.01" defaultValue={field(p.earnedIncomeCents)} placeholder="e.g. 1400" />
            </label>
            <label className="auth-field">
              <span>Other income (benefits, child support received)</span>
              <input type="number" name="unearned_income" min={0} step="0.01" defaultValue={field(p.unearnedIncomeCents)} placeholder="e.g. 200" />
            </label>
            <label className="auth-field">
              <span>Rent or mortgage</span>
              <input type="number" name="rent_mortgage" min={0} step="0.01" defaultValue={field(p.rentMortgageCents)} placeholder="e.g. 950" />
            </label>
            <label className="auth-field">
              <span>Utilities (if not using the standard allowance)</span>
              <input type="number" name="utilities" min={0} step="0.01" defaultValue={field(p.utilitiesCents)} />
            </label>
            <label className="auth-field">
              <span>Childcare / dependent care costs</span>
              <input type="number" name="dependent_care" min={0} step="0.01" defaultValue={field(p.dependentCareCents)} />
            </label>
            <label className="auth-field">
              <span>Child support you pay out</span>
              <input type="number" name="child_support" min={0} step="0.01" defaultValue={field(p.childSupportPaidCents)} />
            </label>
            <label className="auth-field">
              <span>Medical expenses (age 60+ or disabled members)</span>
              <input type="number" name="medical_expenses" min={0} step="0.01" defaultValue={field(p.medicalExpensesCents)} />
            </label>
            <label className="auth-field">
              <span>Cash and bank balances</span>
              <input type="number" name="resources" min={0} step="0.01" defaultValue={field(p.liquidResourcesCents)} />
            </label>
          </div>

          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
            <input type="checkbox" name="elderly_disabled" defaultChecked={p.hasElderlyOrDisabledMember} />
            <span>Someone in my household is age 60+ or receives disability benefits</span>
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" name="use_sua" defaultChecked={p.useStandardUtilityAllowance} />
            <span>I pay for heating or cooling (uses NC&apos;s standard utility allowance)</span>
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" name="qualifying_benefit" defaultChecked={p.receivesQualifyingBenefit} />
            <span>My household receives TANF, SSI, or Work First benefits</span>
          </label>

          <button className="btn btn-primary" type="submit" style={{ marginTop: 10 }}>
            Calculate my estimate
          </button>
          <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--ink-2)" }}>
            Household size comes from your application setup. Figures use FY2026 federal SNAP
            standards and North Carolina&apos;s BBCE rules.
          </p>
        </form>
      </div>
    </div>
  );
}
