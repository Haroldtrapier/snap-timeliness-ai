"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBacklog } from "@/lib/backlog/store";
import type { BacklogRole } from "@/lib/backlog/types";
import { BACKLOG_ROLES } from "@/lib/backlog/config";

const BASE = "/app/agency/backlog";
const NAV = [
  { href: BASE, label: "Dashboard" },
  { href: `${BASE}/upload`, label: "Upload" },
  { href: `${BASE}/queue`, label: "Priority Queue" },
  { href: `${BASE}/cases`, label: "Cases" },
  { href: `${BASE}/reports`, label: "Reports" },
  { href: `${BASE}/alerts`, label: "Alerts" },
  { href: `${BASE}/admin`, label: "Audit & Roles" },
  { href: `${BASE}/settings`, label: "Settings" },
];

export default function BacklogNav() {
  const { state, setActiveCounty, setRole, alerts } = useBacklog();
  const pathname = usePathname() || "";
  const critical = alerts.filter((a) => a.severity === "Critical" || a.severity === "High").length;
  const isActive = (href: string) => (href === BASE ? pathname === BASE : pathname.startsWith(href));

  return (
    <nav className="bk-subnav" aria-label="Backlog Command Center">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className={isActive(n.href) ? "active" : ""}>
          {n.label}
          {n.label === "Alerts" && critical > 0 ? <span className="bk-badge bk-b-red" style={{ marginLeft: 6 }}>{critical}</span> : null}
        </Link>
      ))}
      <span className="grow" />
      <select className="bk-select" value={state.activeCountyId} onChange={(e) => setActiveCounty(e.target.value)} aria-label="County">
        {state.counties.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select className="bk-select" value={state.role} onChange={(e) => setRole(e.target.value as BacklogRole)} aria-label="Role">
        {BACKLOG_ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </nav>
  );
}
