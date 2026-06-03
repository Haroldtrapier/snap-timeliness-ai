import NoticeExplainer from "@/components/dashboards/NoticeExplainer";

export default function NoticeSection() {
  return (
    <section className="section tight" id="notice" data-screen-label="06 Notice explainer">
      <div className="shell">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot" />
            Notice explainer
          </span>
          <h2 className="section-title">
            Plain-language explanations of <em>every benefits notice</em>.
          </h2>
          <p className="section-sub">
            SNAP notices are written for the law, not for people. Upload any notice and SNAP AI
            tells you what it means, what to do, by when, and what to ask your caseworker.
          </p>
        </div>
        <NoticeExplainer />
      </div>
    </section>
  );
}
