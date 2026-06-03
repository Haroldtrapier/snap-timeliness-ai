const STEPS = [
  {
    num: "01",
    title: "Tell us about you",
    body: "Household size, income range, county. Two minutes, in your language. No personal documents required to start.",
  },
  {
    num: "02",
    title: "Get a checklist",
    body: "We translate state and federal SNAP rules into a clear list of what you'll need to gather — tailored to your situation.",
  },
  {
    num: "03",
    title: "Prepare & verify",
    body: "Upload documents, check readiness, and get plain-language explanations of any notice you receive from the agency.",
  },
  {
    num: "04",
    title: "Stay on track",
    body: "Deadline reminders, recertification calendar, change reporting — so you never lose benefits over a missed date.",
  },
];

export default function HowItWorks() {
  return (
    <section className="section tight" id="how" data-screen-label="04 How it works">
      <div className="shell">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot" />
            How it works
          </span>
          <h2 className="section-title">From confused to confident — in four steps.</h2>
        </div>
        <div className="how">
          {STEPS.map((s) => (
            <div className="how-step" key={s.num}>
              <div className="num mono">STEP {s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
