import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ApplicantDashboard from "@/components/dashboards/ApplicantDashboard";
import { getSession } from "@/lib/auth";
import { getApplicantCase, getApplicantClientId } from "@/lib/repositories";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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

  const data = await getApplicantCase(session?.id);

  return (
    <div className="app-surface">
      <div className="section-head">
        <h1 className="section-title">My SNAP application</h1>
        <p className="section-sub">
          Your case stage, readiness score, required documents, and suggested next step.
        </p>
      </div>
      <ApplicantDashboard data={data} />
    </div>
  );
}
