import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ApplicantDashboard from "@/components/dashboards/ApplicantDashboard";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getApplicantCase, getApplicantClientId } from "@/lib/repositories";
import { getLatestEstimate } from "@/lib/prescreen";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const dollars = (c: number) =>
  `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export const metadata: Metadata = {
  title: "My application · SNAP AI",
};

export default async function ApplicantPage() {
  const session = await getSession();

  // Real applicants without a client row yet are sent to onboarding so they
  // generate their own data (rather than seeing the illustrative fixtures).
  if (isSupabaseConfigured && session?.role === "applicant" && session.id !== "demo") {
    const clientId = await getApplicantClientId(session.id);
    if (!clientId) redirect("/app/onboarding");
  }

  const [data, estimate] = await Promise.all([
    getApplicantCase(session?.id),
    getLatestEstimate(session?.id),
  ]);

  return (
    <div className="app-surface">
      <div className="section-head">
        <h1 className="section-title">My SNAP application</h1>
        <p className="section-sub">
          Your case stage, readiness score, required documents, and suggested next step.
        </p>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        {estimate ? (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <strong>
                {estimate.likelyEligible
                  ? `Based on what you entered, you may qualify for an estimated ${dollars(estimate.estimatedMonthlyBenefitCents)}/month.`
                  : "Based on what you entered, you may not qualify right now."}
              </strong>
              {estimate.expedited && (
                <span style={{ display: "block", marginTop: 4 }}>
                  You may also qualify for 7-day expedited processing — tell your county office.
                </span>
              )}
              <span style={{ display: "block", marginTop: 4, fontSize: 13, color: "var(--ink-2)" }}>
                This is an estimate, not a decision — your state SNAP agency decides eligibility.
              </span>
            </div>
            <Link className="btn btn-secondary" href="/app/prescreen">
              Update estimate
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <strong>See if you may qualify — and for about how much.</strong>
              <span style={{ display: "block", marginTop: 4, fontSize: 13, color: "var(--ink-2)" }}>
                Answer a few questions about income and expenses to get a benefit estimate.
              </span>
            </div>
            <Link className="btn btn-primary" href="/app/prescreen">
              Run the pre-screen
            </Link>
          </div>
        )}
      </div>

      <ApplicantDashboard data={data} />
    </div>
  );
}
