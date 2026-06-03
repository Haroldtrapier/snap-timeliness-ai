import {
  APPLICANT_DATA,
  AGENCY_DATA,
  type ApplicantProfile,
  type ApplicantDocument,
  type ApplicantDeadline,
  type DocStatus,
  type AgencyMetric,
  type AgencyClient,
  type ClientStage,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ------------------------------------------------------------------
// Data-access layer.
//
// When Supabase is configured AND the signed-in user has data, these read
// the real tables (clients → snap_cases → checklist/deadlines, etc.,
// scoped by RLS to the owner). Otherwise — not configured, no rows, or any
// error — they fall back to the illustrative fixtures so a surface never
// renders blank or 500s.
// ------------------------------------------------------------------

export interface AgencyCaseload {
  metrics: AgencyMetric[];
  clients: AgencyClient[];
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAY_MS = 1000 * 60 * 60 * 24;

// snap_stage enum → the applicant's 5-step tracker index (Intake … Decision).
const STAGE_INDEX: Record<string, number> = {
  exploring: 0,
  applying: 1,
  pending: 2,
  reporting_change: 2,
  recertifying: 2,
  approved: 4,
  denied: 4,
};

// snap_stage enum → the agency pipeline pill.
const STAGE_PILL: Record<string, ClientStage> = {
  exploring: "intake",
  applying: "docs",
  pending: "review",
  approved: "review",
  denied: "review",
  reporting_change: "review",
  recertifying: "recert",
};

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "—"
  );
}

function caseLabel(id: string): string {
  return `SNAP-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function mapDocStatus(status: string | null | undefined): DocStatus {
  const s = (status ?? "").toLowerCase();
  if (["complete", "verified", "provided", "approved", "received", "done"].includes(s)) return "ok";
  if (["pending", "in_review", "submitted", "uploaded", "processing"].includes(s)) return "pending";
  return "missing";
}

function deadlineBadge(due: Date): ApplicantDeadline["badge"] {
  const days = Math.ceil((due.getTime() - Date.now()) / DAY_MS);
  if (days <= 7) return "urgent";
  if (days <= 21) return "upcoming";
  return "routine";
}

function relativeWhen(due: Date): string {
  const days = Math.ceil((due.getTime() - Date.now()) / DAY_MS);
  if (days < 0) return "overdue";
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `in ${days} days`;
}

/** The client row id owned by this user, or null. Used to gate onboarding. */
export async function getApplicantClientId(userId?: string): Promise<string | null> {
  if (!isSupabaseConfigured || !userId || userId === "demo") return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

export interface ChecklistDocument {
  id: string;
  storagePath: string;
  originalName: string | null;
  uploadedAt: string;
}

export interface ChecklistEntry {
  id: string;
  label: string;
  category: string;
  required: boolean;
  status: string;
  provided: boolean;
  document: ChecklistDocument | null;
}

export interface ApplicantChecklist {
  clientId: string;
  caseId: string;
  checklistId: string;
  items: ChecklistEntry[];
}

/** The signed-in applicant's checklist with item ids, for the Documents page. */
export async function getApplicantChecklist(userId?: string): Promise<ApplicantChecklist | null> {
  if (!isSupabaseConfigured || !userId || userId === "demo") return null;
  try {
    const supabase = await createSupabaseServerClient();

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!client) return null;

    const { data: snapCase } = await supabase
      .from("snap_cases")
      .select("id")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!snapCase) return null;

    const { data: checklist } = await supabase
      .from("application_checklists")
      .select("id")
      .eq("case_id", snapCase.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!checklist) return null;

    const { data: items } = await supabase
      .from("checklist_items")
      .select("id, label, category, required, status")
      .eq("checklist_id", checklist.id);

    const { data: docs } = await supabase
      .from("documents")
      .select("id, checklist_item_id, storage_path, original_name, uploaded_at")
      .eq("client_id", client.id)
      .order("uploaded_at", { ascending: false });

    // newest document per checklist item
    const byItem = new Map<string, ChecklistDocument>();
    (docs ?? []).forEach((d) => {
      if (d.checklist_item_id && !byItem.has(d.checklist_item_id)) {
        byItem.set(d.checklist_item_id, {
          id: d.id,
          storagePath: d.storage_path,
          originalName: d.original_name,
          uploadedAt: d.uploaded_at,
        });
      }
    });

    return {
      clientId: client.id,
      caseId: snapCase.id,
      checklistId: checklist.id,
      items: (items ?? []).map((it) => ({
        id: it.id,
        label: it.label,
        category: it.category,
        required: it.required,
        status: it.status,
        provided: mapDocStatus(it.status) === "ok",
        document: byItem.get(it.id) ?? null,
      })),
    };
  } catch {
    return null;
  }
}

export async function getApplicantCase(userId?: string): Promise<ApplicantProfile> {
  if (!isSupabaseConfigured || !userId || userId === "demo") return APPLICANT_DATA.applicant;

  try {
    const supabase = await createSupabaseServerClient();

    const { data: client } = await supabase
      .from("clients")
      .select("id, full_name, county, state")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!client) return APPLICANT_DATA.applicant;

    const { data: snapCase } = await supabase
      .from("snap_cases")
      .select("id, stage, household_size, filed_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!snapCase) return APPLICANT_DATA.applicant;

    const { data: checklist } = await supabase
      .from("application_checklists")
      .select("id")
      .eq("case_id", snapCase.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let items: { label: string; category: string; status: string; notes: string | null }[] = [];
    if (checklist) {
      const { data } = await supabase
        .from("checklist_items")
        .select("label, category, status, notes, required")
        .eq("checklist_id", checklist.id);
      items = data ?? [];
    }

    const { data: deadlineRows } = await supabase
      .from("deadlines")
      .select("type, due_at, description, suggested_next")
      .eq("client_id", client.id)
      .is("resolved_at", null)
      .order("due_at", { ascending: true })
      .limit(3);

    const { count: minorCount } = await supabase
      .from("household_members")
      .select("id", { count: "exact", head: true })
      .eq("client_id", client.id)
      .eq("is_minor", true);

    const documents: ApplicantDocument[] = items.map((it) => ({
      name: it.label,
      status: mapDocStatus(it.status),
      note: it.notes ?? it.category,
    }));

    const total = documents.length;
    const ready = documents.filter((d) => d.status === "ok").length;
    const readiness = total > 0 ? Math.round((ready / total) * 100) : 0;

    const deadlines: ApplicantDeadline[] = (deadlineRows ?? []).map((d) => {
      const due = new Date(d.due_at);
      return {
        m: MONTHS[due.getUTCMonth()],
        d: due.getUTCDate(),
        what: d.description ?? d.type,
        when: relativeWhen(due),
        badge: deadlineBadge(due),
      };
    });

    const firstMissing = documents.find((d) => d.status !== "ok");
    const nextStep = {
      what:
        deadlineRows?.[0]?.suggested_next ??
        (firstMissing ? `Provide: ${firstMissing.name}` : "You're up to date — no action needed."),
      why: firstMissing
        ? "Completing this strengthens your application before a caseworker reviews it."
        : "A caseworker will make the final decision.",
    };

    const householdSize = snapCase.household_size ?? (documents.length || "—");
    const household =
      `Household of ${householdSize}` +
      (minorCount ? ` · ${minorCount} ${minorCount === 1 ? "child" : "children"}` : "");

    return {
      name: client.full_name,
      case: `Case #${caseLabel(snapCase.id)}`,
      household,
      initials: initialsOf(client.full_name),
      stage: STAGE_INDEX[snapCase.stage] ?? 1,
      readiness,
      documents: documents.length ? documents : APPLICANT_DATA.applicant.documents,
      deadlines: deadlines.length ? deadlines : APPLICANT_DATA.applicant.deadlines,
      nextStep,
    };
  } catch {
    return APPLICANT_DATA.applicant;
  }
}

export async function getAgencyCaseload(userId?: string): Promise<AgencyCaseload> {
  if (!isSupabaseConfigured || !userId || userId === "demo") return AGENCY_DATA;

  try {
    const supabase = await createSupabaseServerClient();

    const { data: cases } = await supabase
      .from("snap_cases")
      .select("id, stage, filed_at, decided_at, clients(full_name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!cases || cases.length === 0) return AGENCY_DATA;

    const active = cases.filter((c) => !c.decided_at).length;
    const decided = cases.filter((c) => c.decided_at && c.filed_at);
    const within30 = decided.filter(
      (c) => new Date(c.decided_at).getTime() - new Date(c.filed_at).getTime() <= 30 * DAY_MS,
    ).length;
    const onTimeRate = decided.length ? (within30 / decided.length) * 100 : 0;
    const avgDays = decided.length
      ? decided.reduce(
          (sum, c) => sum + (new Date(c.decided_at).getTime() - new Date(c.filed_at).getTime()) / DAY_MS,
          0,
        ) / decided.length
      : 0;
    const backlog = cases.filter(
      (c) => !c.decided_at && c.filed_at && Date.now() - new Date(c.filed_at).getTime() > 30 * DAY_MS,
    ).length;

    const metrics: AgencyMetric[] = [
      { label: "Active cases", value: String(active), delta: `${cases.length} total`, dir: "flat" },
      { label: "On-time rate (30d)", value: onTimeRate.toFixed(1), suffix: "%", delta: "rolling", dir: "up" },
      { label: "Avg. days to decide", value: avgDays ? avgDays.toFixed(1) : "—", delta: "decided cases", dir: "up" },
      { label: "Backlog (>30d)", value: String(backlog), delta: "open >30 days", dir: backlog > 0 ? "down" : "flat" },
    ];

    const clients: AgencyClient[] = cases.slice(0, 8).map((c) => {
      const rel = c.clients as { full_name?: string } | { full_name?: string }[] | null;
      const fullName = (Array.isArray(rel) ? rel[0]?.full_name : rel?.full_name) ?? "Unnamed client";
      const ageDays = c.filed_at ? Math.floor((Date.now() - new Date(c.filed_at).getTime()) / DAY_MS) : 0;
      const decided = Boolean(c.decided_at);
      const timeCls: AgencyClient["timeCls"] = decided || ageDays < 20 ? "ok" : ageDays < 30 ? "warn" : "bad";
      const timeLabel = decided ? "Decided" : ageDays >= 30 ? `Late · day ${ageDays}` : `On track · day ${ageDays}`;
      const ready = decided ? 100 : Math.min(95, 15 + ageDays * 3);
      return {
        initials: initialsOf(fullName),
        name: fullName,
        case: caseLabel(c.id),
        stage: STAGE_PILL[c.stage] ?? "review",
        ready,
        time: timeLabel,
        timeCls,
        deadline: decided ? "—" : "Open",
      };
    });

    return { metrics, clients };
  } catch {
    return AGENCY_DATA;
  }
}

// ------------------------------------------------------------------
// Caseworker review queue (agency side). RLS scopes everything to the
// documents the signed-in caseworker may see (org membership via
// is_org_member_of_client), so no explicit org filter is needed here.
// ------------------------------------------------------------------

export interface QueueDocument {
  id: string;
  status: string;
  originalName: string | null;
  storagePath: string;
  uploadedAt: string;
  checklistItemId: string | null;
  label: string | null;
}

export interface QueueClient {
  clientId: string;
  name: string;
  location: string;
  documents: QueueDocument[];
}

function relValue<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export async function getCaseworkerOrgCount(userId?: string): Promise<number> {
  if (!isSupabaseConfigured || !userId || userId === "demo") return 0;
  try {
    const supabase = await createSupabaseServerClient();
    const { count } = await supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getCaseworkerQueue(userId?: string): Promise<QueueClient[]> {
  if (!isSupabaseConfigured || !userId || userId === "demo") return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("documents")
      .select(
        "id, status, original_name, storage_path, uploaded_at, client_id, checklist_item_id, clients(full_name, county, state), checklist_items(label)",
      )
      .order("uploaded_at", { ascending: true });

    const byClient = new Map<string, QueueClient>();
    (data ?? []).forEach((d) => {
      const client = relValue<{ full_name?: string; county?: string; state?: string }>(d.clients);
      const item = relValue<{ label?: string }>(d.checklist_items);
      if (!byClient.has(d.client_id)) {
        const loc = [client?.county, client?.state].filter(Boolean).join(", ");
        byClient.set(d.client_id, {
          clientId: d.client_id,
          name: client?.full_name ?? "Applicant",
          location: loc,
          documents: [],
        });
      }
      byClient.get(d.client_id)!.documents.push({
        id: d.id,
        status: d.status,
        originalName: d.original_name,
        storagePath: d.storage_path,
        uploadedAt: d.uploaded_at,
        checklistItemId: d.checklist_item_id,
        label: item?.label ?? null,
      });
    });

    return [...byClient.values()];
  } catch {
    return [];
  }
}

export interface CaseNote {
  body: string;
  createdAt: string;
}

/** Applicant-visible caseworker notes for the signed-in applicant. */
export async function getApplicantCaseNotes(userId?: string): Promise<CaseNote[]> {
  if (!isSupabaseConfigured || !userId || userId === "demo") return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!client) return [];

    const { data } = await supabase
      .from("case_notes")
      .select("body, created_at, visibility")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return (data ?? [])
      .filter((n) => n.visibility === "applicant_visible")
      .map((n) => ({ body: n.body, createdAt: n.created_at }));
  } catch {
    return [];
  }
}

// ------------------------------------------------------------------
// Admin: organization membership management. Admins can read all orgs,
// memberships, and profiles via RLS; grants/revokes go through the
// admin-only SECURITY DEFINER RPCs.
// ------------------------------------------------------------------

export interface AdminMember {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminOrg {
  id: string;
  name: string;
  state: string | null;
  county: string | null;
  members: AdminMember[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  userType: string;
}

export interface AdminData {
  orgs: AdminOrg[];
  users: AdminUser[];
}

export async function getAdminData(
  session: { id: string; userType?: string } | null,
): Promise<AdminData | null> {
  if (!isSupabaseConfigured || !session || session.userType !== "admin") return null;
  try {
    const supabase = await createSupabaseServerClient();

    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name, state, county")
      .order("name", { ascending: true });

    const { data: members } = await supabase
      .from("organization_members")
      .select("organization_id, user_id, role, profiles(full_name, email)");

    const { data: users } = await supabase
      .from("profiles")
      .select("id, full_name, email, user_type")
      .order("email", { ascending: true });

    const byOrg = new Map<string, AdminMember[]>();
    (members ?? []).forEach((m) => {
      const p = relValue<{ full_name?: string; email?: string }>(m.profiles);
      const arr = byOrg.get(m.organization_id) ?? [];
      arr.push({ userId: m.user_id, name: p?.full_name ?? "", email: p?.email ?? "", role: m.role });
      byOrg.set(m.organization_id, arr);
    });

    return {
      orgs: (orgs ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        state: o.state,
        county: o.county,
        members: byOrg.get(o.id) ?? [],
      })),
      users: (users ?? []).map((u) => ({
        id: u.id,
        name: u.full_name ?? "",
        email: u.email ?? "",
        userType: u.user_type,
      })),
    };
  } catch {
    return null;
  }
}
