import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";

export default function ForAgencies() {
  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold">For county and state SNAP agencies</h1>
      <p className="mt-2 text-gray-600 max-w-2xl">
        Backlog visibility, timeliness measurement, and document-readiness scoring — designed to support eligibility workers, not replace them.
      </p>
      <Disclaimer className="mt-4" />
      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          ["Backlog visibility", "See every aging application with urgency cues."],
          ["On-time rate", "Federal 30-day and 7-day expedited timeliness, measured live."],
          ["Average days to decision", "Watch trend lines by office and worker."],
          ["Missing document queue", "Outreach work routed where it matters."],
          ["Worker queue", "Capacity-aware load balancing."],
          ["Document readiness score", "Per-case score so workers triage faster."],
          ["Review flags", "Possible inconsistencies — never AI decisions — for human review."],
          ["Quality control", "Audit-friendly trails of every AI suggestion and human action."],
          ["Reporting", "Pilot outcome reporting for county and state leadership."],
        ].map(([t, d]) => (
          <div key={t} className="card card-pad">
            <div className="font-semibold">{t}</div>
            <p className="mt-1 text-sm text-gray-700">{d}</p>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <Link href="/pilot" className="btn-primary">Request a pilot</Link>
      </div>
    </div>
  );
}
