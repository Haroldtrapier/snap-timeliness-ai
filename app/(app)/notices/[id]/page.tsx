import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Disclaimer } from "@/components/Disclaimer";
import { getNotice, getNoticeExplanation } from "@/lib/db/notices";
import { NoticeForm } from "../notice-form";

export const dynamic = "force-dynamic";

export default async function NoticeDetailPage({ params }: { params: { id: string } }) {
  if (params.id === "new") {
    return (
      <div className="space-y-4">
        <Link href="/notices" className="text-sm text-brand-700">
          ← All notices
        </Link>
        <header>
          <h1 className="text-2xl font-bold">Explain a notice</h1>
          <p className="text-sm text-gray-600">
            Paste the text of a SNAP notice — we'll give you a plain-language summary, deadline, and required action.
          </p>
        </header>
        <Disclaimer variant="deadline" />
        <NoticeForm />
      </div>
    );
  }

  const notice = await getNotice(params.id);
  if (!notice) notFound();
  const explanation = await getNoticeExplanation(notice.id);

  const questions: string[] = Array.isArray(explanation?.questions)
    ? (explanation!.questions as string[])
    : [];

  return (
    <div className="space-y-4">
      <Link href="/notices" className="text-sm text-brand-700">
        ← All notices
      </Link>
      <header>
        <h1 className="text-2xl font-bold">{notice.title}</h1>
        <p className="text-sm text-gray-600">
          {notice.agency ?? "Agency unknown"} · received {notice.received_at ? formatDate(notice.received_at) : "—"}
        </p>
      </header>
      <Disclaimer variant="deadline" />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card card-pad">
          <h2 className="font-semibold">Original notice (excerpt)</h2>
          <p className="mt-2 text-sm whitespace-pre-line text-gray-700">
            {(notice.raw_text ?? "").slice(0, 1200)}
            {(notice.raw_text ?? "").length > 1200 && "…"}
          </p>
        </div>
        <div className="card card-pad">
          <h2 className="font-semibold">Plain-language explainer</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="font-medium">What this means</dt>
              <dd className="text-gray-700">{explanation?.summary ?? "No summary available yet."}</dd>
            </div>
            <div>
              <dt className="font-medium">What you need to do</dt>
              <dd className="text-gray-700">{explanation?.action ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium">Deadline</dt>
              <dd className="text-gray-700">
                {explanation?.deadline ? formatDate(explanation.deadline) : "No specific deadline"}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Urgency</dt>
              <dd>
                <span
                  className={
                    notice.urgency === "high"
                      ? "badge-red"
                      : notice.urgency === "medium"
                      ? "badge-amber"
                      : "badge-gray"
                  }
                >
                  {notice.urgency ?? "—"}
                </span>
              </dd>
            </div>
            {questions.length > 0 && (
              <div>
                <dt className="font-medium">Questions to ask your caseworker</dt>
                <dd className="text-gray-700">
                  <ul className="list-disc pl-5 space-y-0.5">
                    {questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
