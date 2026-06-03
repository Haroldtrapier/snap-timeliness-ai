import type { Metadata } from "next";
import NoticeExplainer from "@/components/dashboards/NoticeExplainer";

export const metadata: Metadata = {
  title: "Notice explainer · SNAP AI",
};

export default function NoticePage() {
  return (
    <div className="app-surface">
      <div className="section-head">
        <h1 className="section-title">Notice explainer</h1>
        <p className="section-sub">
          Upload a benefits notice and get a plain-language explanation, the deadline, and what to
          do next. Guidance only — your caseworker makes the final decision.
        </p>
      </div>
      <NoticeExplainer />
    </div>
  );
}
