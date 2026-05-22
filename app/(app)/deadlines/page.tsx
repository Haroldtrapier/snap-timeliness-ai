import { redirect } from "next/navigation";
import { daysUntil, formatDate, urgencyForDays } from "@/lib/utils";
import { Disclaimer } from "@/components/Disclaimer";
import { getOwnedClient } from "@/lib/db/cases";
import { listDeadlines } from "@/lib/db/deadlines";
import { DeadlineForm } from "./deadline-form";
import { deleteDeadlineAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DeadlinesPage() {
  const client = await getOwnedClient();
  if (!client) redirect("/onboarding");
  const deadlines = await listDeadlines(client.id);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Deadlines</h1>
        <p className="text-sm text-gray-600">
          Interview dates, document due dates, recertification, periodic reports, and change-reporting deadlines.
        </p>
      </header>
      <Disclaimer variant="deadline" />

      <DeadlineForm />

      {deadlines.length === 0 ? (
        <div className="card card-pad text-sm text-gray-600">
          No deadlines yet. Add one above, or paste a notice on the Notices page — we'll extract any deadline we find.
        </div>
      ) : (
        <ul className="space-y-3">
          {deadlines.map((d) => {
            const days = daysUntil(d.due_at);
            const u = urgencyForDays(days);
            return (
              <li key={d.id} className="card card-pad">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="font-semibold">{d.description ?? d.type}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatDate(d.due_at)} · {d.type.replace("_", " ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        u === "overdue" || u === "high"
                          ? "badge-red"
                          : u === "medium"
                          ? "badge-amber"
                          : "badge-gray"
                      }
                    >
                      {u === "overdue" ? "Overdue" : `${days} day${days === 1 ? "" : "s"}`}
                    </span>
                    <form action={deleteDeadlineAction}>
                      <input type="hidden" name="id" value={d.id} />
                      <button type="submit" className="text-xs text-red-700 hover:underline">
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
                {d.suggested_next && (
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">Suggested next step: </span>
                    {d.suggested_next}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
