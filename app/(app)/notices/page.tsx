import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Disclaimer } from "@/components/Disclaimer";
import { getOwnedClient } from "@/lib/db/cases";
import { listNotices } from "@/lib/db/notices";

export const dynamic = "force-dynamic";

export default async function NoticesPage() {
  const client = await getOwnedClient();
  if (!client) redirect("/onboarding");
  const notices = await listNotices(client.id);

  return (
    <div className="space-y-4">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Notices</h1>
          <p className="text-sm text-gray-600">
            Paste any SNAP notice — we'll give you a plain-language summary and pull out the deadline.
          </p>
        </div>
        <Link href="/notices/new" className="btn-primary">
          Explain a notice
        </Link>
      </header>
      <Disclaimer variant="deadline" />

      {notices.length === 0 ? (
        <div className="card card-pad">
          <p className="text-sm text-gray-700">
            You haven't added any notices yet.{" "}
            <Link href="/notices/new" className="text-brand-700">
              Paste a notice
            </Link>{" "}
            and we'll explain it.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notices.map((n) => (
            <li key={n.id} className="card card-pad">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-xs text-gray-500">
                    {n.agency ?? "Agency unknown"} · received {n.received_at ? formatDate(n.received_at) : "—"}
                  </div>
                </div>
                <span
                  className={
                    n.urgency === "high" ? "badge-red" : n.urgency === "medium" ? "badge-amber" : "badge-gray"
                  }
                >
                  {n.urgency ?? "—"} urgency
                </span>
              </div>
              <div className="mt-3 flex gap-3">
                <Link href={`/notices/${n.id}`} className="text-sm text-brand-700">
                  Open explainer →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
