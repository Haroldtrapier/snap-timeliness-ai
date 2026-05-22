import { Disclaimer } from "@/components/Disclaimer";

const tasks = [
  { id: "t1", label: "Outreach: T. Rivera — missing 30-day pay stubs", priority: "high", due: "Today" },
  { id: "t2", label: "Review flag: A. Brown — possible address mismatch", priority: "medium", due: "Today" },
  { id: "t3", label: "Interview reminder: M. Johnson — 2026-05-28 10:00 AM", priority: "high", due: "Today" },
  { id: "t4", label: "Recertification window opens: J. Patel (next month)", priority: "low", due: "In 12 days" },
];

export default function OrgTasksPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-sm text-gray-600">Priority-ranked work surfaced from your caseload — not an inbox.</p>
      </header>
      <Disclaimer variant="compact" />

      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="card card-pad flex justify-between items-start">
            <div>
              <div className="font-medium text-sm">{t.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">Due {t.due}</div>
            </div>
            <span className={t.priority === "high" ? "badge-red" : t.priority === "medium" ? "badge-amber" : "badge-gray"}>{t.priority}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
