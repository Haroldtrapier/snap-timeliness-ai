import type { Metadata } from "next";
import ApplicantDashboard from "@/components/dashboards/ApplicantDashboard";
import { getSession } from "@/lib/auth";
import { getApplicantCase } from "@/lib/repositories";

export const metadata: Metadata = {
  title: "My application · SNAP AI",
};

export default async function ApplicantPage() {
  const session = await getSession();
  const data = await getApplicantCase(session?.email);

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
