import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/login/actions";

// Authenticated product shell. Middleware already gates /app/*, but we
// resolve the session here too so we can personalize the chrome and
// fail safe if the cookie is malformed.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const roleLabel = session.role === "agency" ? "Agency console" : "Applicant workspace";

  return (
    <div className="app-shell">
      <header className="app-bar">
        <div className="shell app-bar-inner">
          <Link className="brand" href="/app" aria-label="SNAP AI home">
            <div className="brand-mark" aria-hidden="true" />
            <div>
              <div>SNAP AI</div>
              <span className="brand-sub">{roleLabel}</span>
            </div>
          </Link>

          <nav className="app-bar-nav" aria-label="Product">
            <Link href="/app/applicant">My application</Link>
            <Link href="/app/notice">Notice explainer</Link>
            <Link href="/app/agency">Agency</Link>
          </nav>

          <div className="app-bar-user">
            <span className="app-bar-name">{session.name}</span>
            <form action={logout}>
              <button type="submit" className="btn btn-ghost btn-tiny">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main id="main" className="app-main">
        <div className="shell">{children}</div>
      </main>
    </div>
  );
}
