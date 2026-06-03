import type { Metadata } from "next";
import Link from "next/link";
import NoticeExplainer from "@/components/dashboards/NoticeExplainer";
import { getSession } from "@/lib/auth";
import { getNotices } from "@/lib/repositories";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAnthropicConfigured } from "@/lib/anthropic";
import { Icon } from "@/components/Icons";
import { submitNotice } from "./actions";

export const metadata: Metadata = {
  title: "Notice explainer · SNAP AI",
};

function urgencyClass(u: string | null): string {
  if (u === "high") return "bad";
  if (u === "low") return "ok";
  return "pending";
}

export default async function NoticePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSession();

  // Demo mode (no Supabase / demo session): show the illustrative mock.
  if (!isSupabaseConfigured || session?.id === "demo") {
    return (
      <div className="app-surface">
        <div className="section-head">
          <h1 className="section-title">Notice explainer</h1>
          <p className="section-sub">
            Upload a benefits notice and get a plain-language explanation, the deadline, and what
            to do next. Guidance only — your caseworker makes the final decision.
          </p>
        </div>
        <NoticeExplainer />
      </div>
    );
  }

  const notices = await getNotices(session?.id);

  return (
    <div className="app-surface">
      <div className="section-head">
        <h1 className="section-title">Notice explainer</h1>
        <p className="section-sub">
          Paste a confusing benefits notice and get a plain-language explanation, the deadline, and
          what to do next. This is guidance only — your caseworker makes the final decision.
        </p>
      </div>

      {error && (
        <div className="auth-error" role="alert">
          {error === "short"
            ? "Please paste the notice text, or upload a PDF/photo of it."
            : error === "size"
              ? "That file is too large (max 8 MB)."
              : error === "type"
                ? "Please upload a PDF or an image file."
                : "Something went wrong saving your notice."}
        </div>
      )}
      {!isAnthropicConfigured && (
        <div className="auth-info" role="status">
          AI explanations turn on once the Anthropic API key is configured. Your notice is still
          saved for your records.
        </div>
      )}

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <form action={submitNotice} className="auth-form">
          <label className="auth-field">
            <span>Title (optional)</span>
            <input type="text" name="title" placeholder="e.g. Request for verification" />
          </label>
          <label className="auth-field">
            <span>Upload the notice (PDF or photo)</span>
            <input type="file" name="file" accept="application/pdf,image/*" />
          </label>
          <div className="notice-or">
            <span>or</span>
          </div>
          <label className="auth-field">
            <span>Paste the notice text</span>
            <textarea
              name="raw_text"
              rows={7}
              placeholder="Paste the words from your county notice here…"
              className="notice-textarea"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-lg auth-submit">
            <Icon.Translate /> Explain this notice
          </button>
        </form>
      </div>

      {notices.length > 0 && (
        <>
          <div className="card-title" style={{ marginBottom: 10 }}>
            <span>Your notices</span>
          </div>
          <div className="docs-list">
            {notices.map((n) => (
              <Link className="docs-item" href={`/app/notice/${n.id}`} key={n.id}>
                <div className="docs-info">
                  <div className="docs-name">
                    {n.title}
                    {n.urgency && (
                      <span className={"qstatus " + urgencyClass(n.urgency)}>{n.urgency}</span>
                    )}
                  </div>
                  <div className="docs-cat mono">{new Date(n.createdAt).toLocaleDateString()}</div>
                </div>
                <span className="hub-go">
                  Open <Icon.Arrow />
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
