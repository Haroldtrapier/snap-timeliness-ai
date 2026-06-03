import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getAdminData } from "@/lib/repositories";
import { Icon } from "@/components/Icons";
import { createCountyOrg, grantMembership, revokeMembership } from "./actions";

export const metadata: Metadata = {
  title: "Admin · SNAP AI",
};

const ROLES = ["worker", "supervisor", "member", "admin"];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const session = await getSession();
  const data = await getAdminData(session);

  if (!data) {
    return (
      <div className="app-surface">
        <div className="section-head">
          <h1 className="section-title">Admin</h1>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: 0, color: "var(--ink-2)" }}>
            This area is for administrators only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-surface">
      <div className="section-head">
        <h1 className="section-title">Admin · organizations</h1>
        <p className="section-sub">
          Create county organizations and grant caseworkers access to their applicants.
          Membership is the only way an agency user can see applicant cases.
        </p>
      </div>

      {ok && (
        <div className="auth-info" role="status">
          {ok === "org" ? "Organization saved." : ok === "grant" ? "Membership granted." : "Membership revoked."}
        </div>
      )}
      {error && (
        <div className="auth-error" role="alert">
          {error === "org" ? "Enter both state and county." : "That action could not be completed."}
        </div>
      )}

      <div className="card" style={{ padding: 18, marginBottom: 20 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>
          <span>Create a county organization</span>
        </div>
        <form action={createCountyOrg} className="admin-inline-form">
          <input type="text" name="state" placeholder="State (e.g. NC)" maxLength={2} required />
          <input type="text" name="county" placeholder="County (e.g. Cumberland)" required />
          <button type="submit" className="btn btn-navy btn-tiny">
            <Icon.Plus /> Create org
          </button>
        </form>
      </div>

      {data.orgs.length === 0 ? (
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: 0, color: "var(--ink-2)" }}>
            No organizations yet. Create one above, or they appear automatically when an applicant
            onboards with a state and county.
          </p>
        </div>
      ) : (
        <div className="admin-orgs">
          {data.orgs.map((org) => (
            <div className="card admin-org" key={org.id} style={{ padding: 18 }}>
              <div className="admin-org-head">
                <div>
                  <div className="admin-org-name">{org.name}</div>
                  <div className="mono admin-org-loc">
                    {[org.county, org.state].filter(Boolean).join(", ") || "—"}
                  </div>
                </div>
                <span className="mono admin-org-count">{org.members.length} member(s)</span>
              </div>

              {org.members.length > 0 && (
                <ul className="admin-members">
                  {org.members.map((m) => (
                    <li key={m.userId}>
                      <span className="admin-member-id">
                        <b>{m.name || m.email}</b>
                        <span className="mono">{m.role}</span>
                      </span>
                      <form action={revokeMembership}>
                        <input type="hidden" name="user_id" value={m.userId} />
                        <input type="hidden" name="org_id" value={org.id} />
                        <button type="submit" className="btn btn-ghost btn-tiny">
                          Revoke
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              <form action={grantMembership} className="admin-inline-form admin-grant">
                <input type="hidden" name="org_id" value={org.id} />
                <select name="user_id" required aria-label="User to add" defaultValue="">
                  <option value="" disabled>
                    Add a user…
                  </option>
                  {data.users.map((u) => (
                    <option value={u.id} key={u.id}>
                      {(u.name || u.email) + " — " + u.userType}
                    </option>
                  ))}
                </select>
                <select name="role" defaultValue="worker" aria-label="Role">
                  {ROLES.map((r) => (
                    <option value={r} key={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary btn-tiny">
                  Grant access
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
