import Link from "next/link";
import { notFound } from "next/navigation";
import { mockNotices } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Disclaimer } from "@/components/Disclaimer";

export default function NoticeDetailPage({ params }: { params: { id: string } }) {
  if (params.id === "new") {
    return <NewNoticeForm />;
  }
  const n = mockNotices.find((x) => x.id === params.id);
  if (!n) notFound();

  return (
    <div className="space-y-4">
      <Link href="/notices" className="text-sm text-brand-700">← All notices</Link>
      <header>
        <h1 className="text-2xl font-bold">{n.title}</h1>
        <p className="text-sm text-gray-600">{n.agency} · received {formatDate(n.receivedAt)}</p>
      </header>
      <Disclaimer variant="deadline" />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card card-pad">
          <h2 className="font-semibold">Original notice (excerpt)</h2>
          <p className="mt-2 text-sm whitespace-pre-line text-gray-700">{n.excerpt}</p>
        </div>
        <div className="card card-pad">
          <h2 className="font-semibold">Plain-language explainer</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="font-medium">What this means</dt>
              <dd className="text-gray-700">{n.summary}</dd>
            </div>
            <div>
              <dt className="font-medium">What you need to do</dt>
              <dd className="text-gray-700">{n.action}</dd>
            </div>
            <div>
              <dt className="font-medium">Deadline</dt>
              <dd className="text-gray-700">{n.deadline ? formatDate(n.deadline) : "No specific deadline"}</dd>
            </div>
            <div>
              <dt className="font-medium">Urgency</dt>
              <dd><span className={n.urgency === "high" ? "badge-red" : n.urgency === "medium" ? "badge-amber" : "badge-gray"}>{n.urgency}</span></dd>
            </div>
            <div>
              <dt className="font-medium">Questions to ask your caseworker</dt>
              <dd className="text-gray-700">
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>Can you confirm what was received already?</li>
                  <li>Is there anything else you need from me?</li>
                  <li>Can the deadline be extended if I have trouble getting a document?</li>
                </ul>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function NewNoticeForm() {
  return (
    <div className="space-y-4">
      <Link href="/notices" className="text-sm text-brand-700">← All notices</Link>
      <header>
        <h1 className="text-2xl font-bold">Explain a notice</h1>
        <p className="text-sm text-gray-600">Paste the text of a SNAP notice — we'll give you a plain-language summary, deadline, and required action.</p>
      </header>
      <Disclaimer variant="deadline" />

      <form className="card card-pad space-y-3">
        <div>
          <label className="label">Paste notice text</label>
          <textarea className="input" rows={8} placeholder="Paste the full text of your SNAP notice here..." />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Or upload a photo of the notice (coming in pilot).</span>
          <button className="btn-primary" type="button" disabled>Explain (pilot)</button>
        </div>
      </form>
    </div>
  );
}
