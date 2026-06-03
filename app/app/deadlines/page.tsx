import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getDeadlines, type DeadlineItem } from "@/lib/repositories";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Icon } from "@/components/Icons";
import { addDeadline, resolveDeadline } from "./actions";

export const metadata: Metadata = {
  title: "Deadlines · SNAP AI",
};

const TYPES = ["Verification", "Interview", "Recertification", "Change report", "Other"];
const DAY_MS = 1000 * 60 * 60 * 24;

function relative(dueAt: string): { label: string; cls: string } {
  const days = Math.ceil((new Date(dueAt).getTime() - Date.now()) / DAY_MS);
  if (days < 0) return { label: `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`, cls: "bad" };
  if (days === 0) return { label: "due today", cls: "bad" };
  if (days <= 7) return { label: `in ${days} day${days === 1 ? "" : "s"}`, cls: "pending" };
  return { label: `in ${days} days`, cls: "ok" };
}

function Row({ d }: { d: DeadlineItem }) {
  const due = new Date(d.dueAt);
  const rel = relative(d.dueAt);
  return (
    <div className={"deadline-card" + (d.resolved ? " done" : "")}>
      <div className="deadline-date">
        <div className="m mono">{due.toLocaleString(undefined, { month: "short" }).toUpperCase()}</div>
        <div className="d">{due.getUTCDate()}</div>
      </div>
      <div className="deadline-body">
        <div className="deadline-type">
          {d.type}
          {!d.resolved && <span className={"qstatus " + rel.cls}>{rel.label}</span>}
          {d.resolved && <span className="qstatus ok">done</span>}
        </div>
        {d.description && <div className="deadline-desc">{d.description}</div>}
        {d.suggestedNext && !d.resolved && (
          <div className="deadline-next mono">Next: {d.suggestedNext}</div>
        )}
      </div>
      {!d.resolved && (
        <form action={resolveDeadline}>
          <input type="hidden" name="id" value={d.id} />
          <button type="submit" className="btn btn-ghost btn-tiny">
            <Icon.Check /> Mark done
          </button>
        </form>
      )}
    </div>
  );
}

export default async function DeadlinesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const session = await getSession();

  if (!isSupabaseConfigured || session?.id === "demo") {
    return (
      <div className="app-surface">
        <div className="section-head">
          <h1 className="section-title">Deadlines</h1>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: 0, color: "var(--ink-2)" }}>
            Deadline tracking is available when signed in with a real account.
          </p>
        </div>
      </div>
    );
  }

  const all = await getDeadlines(session?.id);
  const upcoming = all.filter((d) => !d.resolved);
  const done = all.filter((d) => d.resolved);

  return (
    <div className="app-surface">
      <div className="section-head">
        <h1 className="section-title">Deadlines</h1>
        <p className="section-sub">
          Keep every SNAP date in one place — verifications, interviews, recertification. The
          leading reason families lose benefits is a missed date.
        </p>
      </div>

      {ok && (
        <div className="auth-info" role="status">
          {ok === "done" ? "Marked done." : "Deadline added."}
        </div>
      )}
      {error && (
        <div className="auth-error" role="alert">
          {error === "date" ? "Please choose a valid due date." : "Something went wrong."}
        </div>
      )}

      <div className="card" style={{ padding: 18, marginBottom: 20 }}>
        <form action={addDeadline} className="admin-inline-form">
          <select name="type" defaultValue="Verification" aria-label="Type">
            {TYPES.map((t) => (
              <option value={t} key={t}>
                {t}
              </option>
            ))}
          </select>
          <input type="date" name="due_at" required aria-label="Due date" />
          <input type="text" name="description" placeholder="Description (optional)" style={{ flex: 1, minWidth: 180 }} />
          <button type="submit" className="btn btn-primary btn-tiny">
            <Icon.Plus /> Add deadline
          </button>
        </form>
      </div>

      {upcoming.length === 0 && done.length === 0 ? (
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: 0, color: "var(--ink-2)" }}>
            No deadlines yet. Add one above, or they appear as your case progresses.
          </p>
        </div>
      ) : (
        <>
          <div className="deadline-list">
            {upcoming.map((d) => (
              <Row d={d} key={d.id} />
            ))}
          </div>

          {done.length > 0 && (
            <details style={{ marginTop: 18 }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--ink-3)", fontSize: 13 }}>
                Completed ({done.length})
              </summary>
              <div className="deadline-list" style={{ marginTop: 10 }}>
                {done.map((d) => (
                  <Row d={d} key={d.id} />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
