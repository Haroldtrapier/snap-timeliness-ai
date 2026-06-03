import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Icon, type IconName } from "@/components/Icons";

const SURFACES: { href: string; icon: IconName; title: string; body: string; roles: string[] }[] = [
  {
    href: "/app/applicant",
    icon: "Home",
    title: "My SNAP application",
    body: "Your case stage, readiness score, required documents, and the single next step.",
    roles: ["applicant"],
  },
  {
    href: "/app/notice",
    icon: "Mail",
    title: "Notice explainer",
    body: "Turn a confusing county notice into a plain-language explanation and a clear action.",
    roles: ["applicant", "agency"],
  },
  {
    href: "/app/agency",
    icon: "Grid",
    title: "Agency console",
    body: "Caseload metrics, timeliness, and the human-in-the-loop review queue.",
    roles: ["agency"],
  },
];

export default async function AppHome() {
  const session = await getSession();
  const role = session?.role ?? "applicant";
  const ordered = [...SURFACES].sort(
    (a, b) => Number(b.roles.includes(role)) - Number(a.roles.includes(role)),
  );

  return (
    <div className="app-hub">
      <div className="section-head">
        <span className="eyebrow">
          <span className="dot" />
          Signed in{session ? ` as ${session.name}` : ""}
        </span>
        <h1 className="section-title">Your SNAP AI workspace</h1>
        <p className="section-sub">
          Pick up where you left off. Everything here is preparation and guidance — final
          eligibility decisions are made by your state SNAP agency.
        </p>
      </div>

      <div className="hub-grid">
        {ordered.map((s) => {
          const I = Icon[s.icon];
          const primary = s.roles.includes(role);
          return (
            <Link className={"hub-card" + (primary ? " primary" : "")} href={s.href} key={s.href}>
              <div className="hub-ic">
                <I />
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <span className="hub-go">
                Open <Icon.Arrow />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
