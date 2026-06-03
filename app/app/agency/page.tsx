import type { Metadata } from "next";
import AgencyDashboard from "@/components/dashboards/AgencyDashboard";
import { getSession } from "@/lib/auth";
import { getAgencyCaseload } from "@/lib/repositories";

export const metadata: Metadata = {
  title: "Agency console · SNAP AI",
};

export default async function AgencyPage() {
  const session = await getSession();
  const data = await getAgencyCaseload(session?.email);

  return (
    <div className="app-surface">
      <div className="section-head">
        <h1 className="section-title">Agency console</h1>
        <p className="section-sub">
          Caseload metrics, timeliness signals, and the review queue. Every flag is a signal for a
          caseworker — SNAP AI never makes the final decision.
        </p>
      </div>
      <AgencyDashboard data={data} />
    </div>
  );
}
