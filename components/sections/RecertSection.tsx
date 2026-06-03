import { Icon } from "@/components/Icons";

interface CalDay {
  d: number | "";
  muted?: boolean;
  today?: boolean;
  warn?: boolean;
  event?: boolean;
}

// Static May 2026 mock calendar, matching the design reference.
function buildDays(): CalDay[] {
  const days: CalDay[] = [];
  for (let i = 0; i < 4; i++) days.push({ d: "", muted: true });
  for (let d = 1; d <= 31; d++) {
    const obj: CalDay = { d };
    if (d === 16) obj.today = true;
    if (d === 19) obj.warn = true;
    if (d === 24) obj.event = true;
    if (d === 28) obj.event = true;
    days.push(obj);
  }
  while (days.length < 35) days.push({ d: "", muted: true });
  return days;
}

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RecertSection() {
  const days = buildDays();
  return (
    <section className="section tight" id="recert" data-screen-label="08 Recertification">
      <div className="shell">
        <div className="split">
          <div className="card" style={{ padding: 24 }}>
            <div className="card-title">
              <span>Your benefits calendar</span>
              <span className="meta">May 2026</span>
            </div>
            <div className="calendar" style={{ marginTop: 14 }} role="img" aria-label="May 2026 benefits calendar with three upcoming events">
              {DAY_HEADERS.map((h) => (
                <div key={h} className="cal-h">
                  {h}
                </div>
              ))}
              {days.map((d, i) => (
                <div
                  key={i}
                  className={
                    "cal-d" +
                    (d.muted ? " muted" : "") +
                    (d.today ? " today" : "") +
                    (d.event ? " event" : "") +
                    (d.warn ? " warn" : "")
                  }
                >
                  {d.d}
                </div>
              ))}
            </div>

            <div className="reminder-stack">
              <div className="reminder urgent">
                <div className="ic">
                  <Icon.Alert />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="what">Submit income verification</div>
                  <div className="when mono">DUE FRI MAY 22 · 6 DAYS</div>
                </div>
              </div>
              <div className="reminder warn">
                <div className="ic">
                  <Icon.Phone />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="what">Phone interview with J. Whitman</div>
                  <div className="when mono">TUE MAY 24 · 10:30 AM</div>
                </div>
              </div>
              <div className="reminder">
                <div className="ic">
                  <Icon.Refresh />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="what">Recertification opens</div>
                  <div className="when mono">WED MAY 28 · ANNUAL</div>
                </div>
              </div>
            </div>
          </div>

          <div className="split-copy">
            <span className="eyebrow">
              <span className="dot" />
              For recipients
            </span>
            <h3 style={{ marginTop: 16 }}>
              Never lose benefits over a <em>missed date</em>.
            </h3>
            <p>
              The leading reason families lose SNAP benefits is administrative — a missed
              recertification deadline, an unread notice, an unreported change. SNAP AI keeps the
              calendar so you don&apos;t have to.
            </p>
            <ul>
              <li>
                <Icon.Check />
                <span>
                  <b>Recertification reminders</b> at 90, 60, 30, 14, and 3 days — by text,
                  email, or phone call.
                </span>
              </li>
              <li>
                <Icon.Check />
                <span>
                  <b>Change reporting prep.</b> Moved? New job? Lost hours? We walk you through
                  what your state requires you to report.
                </span>
              </li>
              <li>
                <Icon.Check />
                <span>
                  <b>Interview coaching.</b> Practice the phone interview with a private,
                  practice-only walkthrough.
                </span>
              </li>
              <li>
                <Icon.Check />
                <span>
                  <b>Family-friendly.</b> Calendar, reminders, and notices shared with a trusted
                  family member or navigator.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
