import Link from "next/link";
import { mockNotices } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Disclaimer } from "@/components/Disclaimer";

export default function NoticesPage() {
  return (
    <div className="space-y-4">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Notices</h1>
          <p className="text-sm text-gray-600">Paste or upload any notice — we'll give you a plain-language summary and the deadline.</p>
        </div>
        <Link href="/notices/new" className="btn-primary">Explain a notice</Link>
      </header>
      <Disclaimer variant="deadline" />

      <ul className="space-y-3">
        {mockNotices.map((n) => (
          <li key={n.id} className="card card-pad">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{n.title}</div>
                <div className="text-xs text-gray-500">{n.agency} · received {formatDate(n.receivedAt)}</div>
              </div>
              <span className={n.urgency === "high" ? "badge-red" : n.urgency === "medium" ? "badge-amber" : "badge-gray"}>
                {n.urgency} urgency
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-700">{n.summary || n.excerpt}</p>
            <div className="mt-3 flex gap-3">
              <Link href={`/notices/${n.id}`} className="text-sm text-brand-700">Open explainer →</Link>
              {n.deadline && <span className="text-sm text-gray-600">Deadline: {formatDate(n.deadline)}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
