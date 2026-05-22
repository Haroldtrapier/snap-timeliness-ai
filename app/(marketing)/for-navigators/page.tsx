import { Disclaimer } from "@/components/Disclaimer";

export default function ForNavigators() {
  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold">For benefits navigators and nonprofits</h1>
      <p className="mt-2 text-gray-600 max-w-2xl">
        Manage a caseload with clarity. SNAP AI surfaces missing documents, urgent deadlines, and review flags across every client you support.
      </p>
      <Disclaimer className="mt-4" />
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {[
          ["Caseload dashboard", "Active cases, days open, missing docs, urgent deadlines — at a glance."],
          ["Task queue", "Priority-ranked work, not an inbox."],
          ["Document readiness", "See exactly which documents are missing per client and outreach faster."],
          ["Notice explainer", "Help clients understand notices in seconds."],
          ["Deadline calendar", "Every interview, document due date, and recertification across your caseload."],
          ["Review flags", "Possible inconsistencies routed to human judgment — never automated decisions."],
        ].map(([t, d]) => (
          <div key={t} className="card card-pad">
            <div className="font-semibold">{t}</div>
            <p className="mt-1 text-sm text-gray-700">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
