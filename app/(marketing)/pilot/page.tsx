import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";

export default function PilotPage() {
  return (
    <div className="container-page py-12">
      <span className="badge-green">For county and state leadership</span>
      <h1 className="mt-2 text-3xl font-bold">A 60–90 day SNAP AI pilot — no real resident data required</h1>
      <p className="mt-2 text-gray-600 max-w-3xl">
        We designed the SNAP AI pilot so a county can prove value within a fiscal quarter without touching live SNAP records. The pilot runs on a sandbox dataset with 3–5 staff users and a human-in-the-loop workflow.
      </p>
      <Disclaimer className="mt-4" />

      <section className="mt-8 grid md:grid-cols-2 gap-4">
        <div className="card card-pad">
          <h2 className="font-semibold">What the pilot includes</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>60–90 day county pilot</li>
            <li>No real resident data required for demo</li>
            <li>Sandbox/mock dataset option for evaluation</li>
            <li>3–5 staff user seats</li>
            <li>Human-in-the-loop workflow — every AI signal is reviewed by a worker</li>
            <li>Cybersecurity and privacy overview document</li>
            <li>Weekly outcome reporting</li>
          </ul>
        </div>
        <div className="card card-pad">
          <h2 className="font-semibold">Measurable outcomes</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Reduced incomplete applications</li>
            <li>Faster document review</li>
            <li>Better deadline visibility for applicants</li>
            <li>Backlog visibility for supervisors</li>
            <li>Improved caseworker workload visibility</li>
          </ul>
        </div>
      </section>

      <section className="mt-8 card card-pad">
        <h2 className="font-semibold">Implementation timeline</h2>
        <ol className="mt-3 grid md:grid-cols-4 gap-3 text-sm">
          {[
            ["Week 1", "Pilot kickoff, sandbox dataset selected, staff onboarded."],
            ["Weeks 2–4", "Workflow integration, navigator/worker training, baseline metrics captured."],
            ["Weeks 5–10", "Live pilot with weekly outcome review and staff feedback loop."],
            ["Weeks 11–13", "Outcome report, applicant experience feedback, expansion decision."],
          ].map(([w, d]) => (
            <li key={w} className="rounded border border-gray-200 p-3">
              <div className="font-semibold text-brand-700">{w}</div>
              <div className="mt-1 text-gray-700">{d}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 grid md:grid-cols-2 gap-4">
        <div className="card card-pad">
          <h2 className="font-semibold">Cybersecurity and privacy</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Supabase Postgres with row-level security on every table</li>
            <li>Protected storage buckets — documents never publicly addressable</li>
            <li>Server-side AI routes only — API keys never reach the browser</li>
            <li>Role-based access control: applicant, navigator, county, state, admin</li>
            <li>Full audit log of AI suggestions and human actions</li>
            <li>Sandbox mode for pilots — no production resident data required</li>
          </ul>
        </div>
        <div className="card card-pad">
          <h2 className="font-semibold">Policy-safe implementation</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>SNAP AI does not approve or deny benefits</li>
            <li>SNAP AI does not make eligibility determinations</li>
            <li>SNAP AI never issues fraud findings — flags are for human review only</li>
            <li>Aligned with caseworker workflows, not in place of them</li>
            <li>Designed to support state oversight and quality control</li>
          </ul>
        </div>
      </section>

      <section className="mt-8 card card-pad">
        <h2 className="font-semibold">Feedback loops</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Weekly staff feedback session during pilot</li>
          <li>Applicant experience feedback collected at every milestone</li>
          <li>Pilot debrief and outcome report shared with county leadership</li>
        </ul>
      </section>

      <div className="mt-8 flex gap-3">
        <Link href="/signup" className="btn-primary">Request pilot scoping</Link>
        <Link href="/integrity" className="btn-secondary">Integrity overview</Link>
      </div>
    </div>
  );
}
