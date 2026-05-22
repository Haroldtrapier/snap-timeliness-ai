import Link from "next/link";
import { mockOrgDashboard, mockOrgClients } from "@/lib/mock-data";
import { Disclaimer } from "@/components/Disclaimer";

export default function OrgDashboard() {
  const d = mockOrgDashboard;
  const stats: [string, string | number, string][] = [
    ["Active cases", d.activeCases, ""],
    ["On-time rate", `${Math.round(d.onTimeRate * 100)}%`, "Federal 30/7 day"],
    ["Avg days to decision", d.avgDaysToDecision, ""],
    ["Backlog", d.backlog, "Aging applications"],
    ["Missing-doc queue", d.missingDocQueue, "Outreach needed"],
    ["Urgent deadlines", d.urgentDeadlines, "Next 7 days"],
    ["Review flags", d.reviewFlags, "Human review"],
  ];
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Agency overview</h1>
        <p className="text-sm text-gray-600">Cumberland County DSS — pilot sandbox dataset.</p>
      </header>
      <Disclaimer variant="default" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(([label, val, sub]) => (
          <div key={label} className="card card-pad">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{val}</div>
            {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card card-pad">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Worker queue</h2>
            <Link href="/org/tasks" className="text-sm text-brand-700">View tasks</Link>
          </div>
          <p className="mt-2 text-sm text-gray-700">{d.missingDocQueue} clients need outreach for missing documents.</p>
          <p className="text-sm text-gray-700">{d.urgentDeadlines} cases have deadlines in the next 7 days.</p>
        </div>
        <div className="card card-pad">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Review flags</h2>
            <Link href="/org/clients" className="text-sm text-brand-700">View clients</Link>
          </div>
          <p className="mt-2 text-sm text-gray-700">{d.reviewFlags} possible inconsistencies awaiting human review. Caseworker support — not caseworker replacement.</p>
        </div>
      </div>

      <div className="card card-pad">
        <h2 className="font-semibold">Recent client activity</h2>
        <ul className="mt-3 divide-y divide-gray-100">
          {mockOrgClients.map((c) => (
            <li key={c.id} className="py-2 flex justify-between text-sm">
              <Link href={`/org/clients/${c.id}`} className="font-medium text-brand-700">{c.name}</Link>
              <div className="text-gray-700">
                {c.stage.replace("_", " ")} · {c.daysOpen}d open ·{" "}
                {c.missingDocs > 0 ? <span className="badge-amber">{c.missingDocs} missing</span> : <span className="badge-green">docs ok</span>}
                {c.flags > 0 && <span className="ml-1 badge-red">{c.flags} flag</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
