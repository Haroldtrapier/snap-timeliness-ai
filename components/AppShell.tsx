import Link from "next/link";
import { Disclaimer } from "./Disclaimer";
import { logoutAction } from "@/app/(auth)/actions";

const appLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/eligibility-check", label: "Eligibility check" },
  { href: "/application-checklist", label: "Checklist" },
  { href: "/documents", label: "Documents" },
  { href: "/notices", label: "Notices" },
  { href: "/deadlines", label: "Deadlines" },
  { href: "/benefit-planner", label: "Benefit planner" },
  { href: "/grocery-plan", label: "Grocery plan" },
  { href: "/assistant", label: "Assistant" },
  { href: "/settings", label: "Settings" },
];

const orgLinks = [
  { href: "/org/dashboard", label: "Overview" },
  { href: "/org/clients", label: "Clients" },
  { href: "/org/tasks", label: "Tasks" },
  { href: "/org/deadlines", label: "Deadlines" },
  { href: "/org/reports", label: "Reports" },
  { href: "/org/settings", label: "Settings" },
];

export function AppShell({
  children,
  variant = "applicant",
  userEmail,
}: {
  children: React.ReactNode;
  variant?: "applicant" | "org";
  userEmail?: string | null;
}) {
  const links = variant === "org" ? orgLinks : appLinks;
  const homeHref = variant === "org" ? "/org/dashboard" : "/dashboard";
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="container-page flex h-14 items-center justify-between">
          <Link href={homeHref} className="font-bold text-brand-700 text-lg">
            SNAP AI {variant === "org" && <span className="text-gray-500 font-normal">— Agency</span>}
          </Link>
          <div className="flex items-center gap-3">
            {userEmail && <span className="hidden sm:inline text-xs text-gray-500">{userEmail}</span>}
            <form action={logoutAction}>
              <button type="submit" className="btn-ghost text-sm">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="container-page py-6 grid md:grid-cols-[200px_1fr] gap-6">
        <aside className="hidden md:block">
          <nav className="card p-2 sticky top-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">
          <Disclaimer variant="compact" className="mb-4" />
          {children}
        </main>
      </div>
    </div>
  );
}
