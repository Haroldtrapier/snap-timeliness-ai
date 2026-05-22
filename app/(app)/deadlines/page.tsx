import { mockDeadlines } from "@/lib/mock-data";
import { daysUntil, formatDate, urgencyForDays } from "@/lib/utils";
import { Disclaimer } from "@/components/Disclaimer";

export default function DeadlinesPage() {
  const sorted = [...mockDeadlines].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Deadlines</h1>
        <p className="text-sm text-gray-600">Interview dates, document due dates, recertification, periodic reports, and change-reporting deadlines.</p>
      </header>
      <Disclaimer variant="deadline" />

      <ul className="space-y-3">
        {sorted.map((d) => {
          const days = daysUntil(d.date);
          const u = urgencyForDays(days);
          return (
            <li key={d.id} className="card card-pad">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{d.description}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {formatDate(d.date)} · {d.type.replace("_", " ")}
                  </div>
                </div>
                <span className={u === "overdue" ? "badge-red" : u === "high" ? "badge-red" : u === "medium" ? "badge-amber" : "badge-gray"}>
                  {u === "overdue" ? "Overdue" : `${days} day${days === 1 ? "" : "s"}`}
                </span>
              </div>
              {d.suggestedNext && (
                <div className="mt-2 text-sm text-gray-700">
                  <span className="font-medium">Suggested next step: </span>{d.suggestedNext}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
