import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";

export default function HomePage() {
  return (
    <div>
      <section className="container-page py-16">
        <div className="max-w-3xl">
          <span className="badge-green">Pilot-ready — Cumberland County, NC</span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Help families move SNAP cases forward — faster, with humans in the loop.
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            SNAP AI is guidance and preparation software for applicants, current recipients, navigators, and county DSS teams. We help people understand requirements, prepare documents, explain notices, and track deadlines. Caseworker support — not caseworker replacement.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary">Get started</Link>
            <Link href="/pilot" className="btn-secondary">County / state pilot</Link>
          </div>
          <div className="mt-6">
            <Disclaimer variant="default" />
          </div>
        </div>
      </section>

      <section className="container-page py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { t: "Applicants", d: "Prepare documents, understand notices, track deadlines.", h: "/for-applicants" },
          { t: "Recipients", d: "Recertification reminders, change reporting, EBT budgeting.", h: "/for-recipients" },
          { t: "Navigators", d: "Manage a caseload, surface missing docs, prioritize work.", h: "/for-navigators" },
          { t: "Agencies", d: "Backlog visibility, on-time rate, document readiness scoring.", h: "/for-agencies" },
        ].map((x) => (
          <Link key={x.t} href={x.h} className="card card-pad hover:shadow-md transition">
            <div className="font-semibold text-gray-900">{x.t}</div>
            <div className="mt-1 text-sm text-gray-600">{x.d}</div>
          </Link>
        ))}
      </section>

      <section className="container-page py-12">
        <h2 className="text-2xl font-bold">What SNAP AI does — and doesn't do</h2>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="card card-pad">
            <div className="font-semibold text-brand-700">SNAP AI does</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Explain SNAP requirements in plain language</li>
              <li>Generate tailored document checklists</li>
              <li>Classify uploaded documents and flag issues for human review</li>
              <li>Summarize notices and identify deadlines</li>
              <li>Track interview, document, and recertification deadlines</li>
              <li>Help navigators and county DSS staff prioritize cases</li>
            </ul>
          </div>
          <div className="card card-pad">
            <div className="font-semibold text-red-700">SNAP AI does not</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Approve or deny SNAP benefits</li>
              <li>Make final eligibility decisions</li>
              <li>Replace caseworkers or eligibility specialists</li>
              <li>Issue government determinations</li>
              <li>Make fraud findings — flags are for human review only</li>
              <li>Provide legal advice</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
