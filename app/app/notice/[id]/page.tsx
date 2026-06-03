import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getNotice } from "@/lib/repositories";
import { Icon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Notice · SNAP AI",
};

function urgencyClass(u: string | null): string {
  if (u === "high") return "high";
  if (u === "low") return "low";
  return "med";
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const notice = await getNotice(id, session?.id);

  if (!notice) {
    return (
      <div className="app-surface">
        <div className="section-head">
          <h1 className="section-title">Notice</h1>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: 0, color: "var(--ink-2)" }}>
            We couldn&apos;t find that notice.{" "}
            <Link href="/app/notice" style={{ color: "var(--green-2)", fontWeight: 600 }}>
              Back to notices
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const exp = notice.explanation;

  return (
    <div className="app-surface">
      <div className="section-head">
        <Link href="/app/notice" className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>
          ← All notices
        </Link>
        <h1 className="section-title">{notice.title}</h1>
        <p className="section-sub mono" style={{ fontSize: 12 }}>
          Saved {new Date(notice.createdAt).toLocaleString()}
        </p>
      </div>

      {exp ? (
        <div className="notice-right" style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", marginBottom: 16 }}>
          {exp.urgency && (
            <div className={"urgency " + urgencyClass(exp.urgency) + " mono"}>
              {exp.urgency} urgency
            </div>
          )}
          {exp.summary && <p className="plain-summary">{exp.summary}</p>}

          <div className="notice-fields">
            <div className="notice-field">
              <div className="k">DEADLINE</div>
              <div className="v">
                {exp.deadline ? new Date(exp.deadline).toLocaleDateString() : "None found"}
              </div>
            </div>
            <div className="notice-field">
              <div className="k">WHAT TO DO</div>
              <div className="v">{exp.action || "—"}</div>
            </div>
          </div>

          {exp.questions.length > 0 && (
            <div className="notice-questions">
              <div className="head">Questions to ask your caseworker</div>
              <ul>
                {exp.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          <div
            style={{
              padding: "10px 14px",
              background: "var(--info-soft)",
              border: "1px solid var(--info-ring)",
              borderRadius: 8,
              fontSize: 12.5,
              color: "var(--navy-2)",
              lineHeight: 1.5,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <Icon.Info style={{ color: "var(--info)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <b>This is guidance, not legal advice.</b> Your caseworker makes the final decision
              about your case.
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <p style={{ margin: 0, color: "var(--ink-2)" }}>
            Your notice is saved. A plain-language explanation isn&apos;t available yet (the AI
            explainer may not be configured).
          </p>
        </div>
      )}

      {notice.rawText && (
        <details className="card" style={{ padding: 18 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--navy)" }}>
            Original notice text
          </summary>
          <pre className="notice-raw">{notice.rawText}</pre>
        </details>
      )}
    </div>
  );
}
