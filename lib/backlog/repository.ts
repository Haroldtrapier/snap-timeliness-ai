import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BacklogState, County, DocItem, SnapCase, Worker, AuditEntry, CaseStatus } from "@/lib/backlog/types";
import type { BacklogAction } from "@/lib/backlog/actions";
import { DEFAULT_PRESCREEN_CONFIG } from "@/lib/backlog/config";
import { SEED_COUNTIES, SEED_WORKERS } from "@/lib/backlog/seed";

// ---------------------------------------------------------------------------
// Server-side persistence for the Backlog Command Center.
//
// Active only when Supabase is configured AND a non-demo agency user is signed
// in. Everything is owner-scoped by RLS (owner_user_id = auth.uid()). When not
// available, callers fall back to the client localStorage store.
// ---------------------------------------------------------------------------

export interface BacklogPrincipal {
  userId: string;
  userName: string;
}

async function principal(): Promise<BacklogPrincipal | null> {
  if (!isSupabaseConfigured) return null;
  const session = await getSession();
  if (!session || session.id === "demo" || session.role !== "agency") return null;
  return { userId: session.id, userName: session.name || session.email || "agency.user" };
}

export async function isBacklogServerBacked(): Promise<boolean> {
  return (await principal()) !== null;
}

// Ensure this owner has a worker roster to assign from (seeded once).
async function ensureWorkers(supabase: SupabaseClient, ownerId: string): Promise<Worker[]> {
  const { data } = await supabase.from("bk_workers").select("id, county_id, name, title, role");
  if (data && data.length > 0) {
    return data.map((w) => ({ id: w.id, countyId: w.county_id, name: w.name, title: w.title, role: w.role }));
  }
  const rows = SEED_WORKERS.map((w) => ({ id: w.id, owner_user_id: ownerId, county_id: w.countyId, name: w.name, title: w.title, role: w.role }));
  await supabase.from("bk_workers").upsert(rows, { onConflict: "id" });
  return SEED_WORKERS;
}

/** Load the full backlog state for the signed-in owner, or null if not server-backed. */
export async function loadBacklogState(): Promise<BacklogState | null> {
  const p = await principal();
  if (!p) return null;
  try {
    const supabase = await createSupabaseServerClient();

    const [{ data: countyRows }, workers] = await Promise.all([
      supabase.from("bk_counties").select("id, name, state"),
      ensureWorkers(supabase, p.userId),
    ]);
    const counties: County[] = (countyRows && countyRows.length ? countyRows : SEED_COUNTIES).map((c) => ({ id: c.id, name: c.name, state: c.state }));

    const { data: caseRows } = await supabase
      .from("bk_cases")
      .select("id, external_id, applicant_label, county_id, application_date, status, expedited, household_size, monthly_income, monthly_expenses, assigned_worker_id, vulnerability_flags, created_at, updated_at")
      .order("created_at", { ascending: false });

    const caseIds = (caseRows ?? []).map((c) => c.id);
    const [{ data: docRows }, { data: noteRows }, { data: auditRows }] = await Promise.all([
      caseIds.length ? supabase.from("bk_case_documents").select("id, case_id, doc_key, label, required, status") : Promise.resolve({ data: [] as any[] }),
      caseIds.length ? supabase.from("bk_notes").select("id, case_id, body, author, created_at").order("created_at", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
      supabase.from("bk_audit").select("id, at, user_id, case_external_id, county_id, action, prev, next, system_note, automated").order("at", { ascending: false }).limit(500),
    ]);

    const docsByCase = new Map<string, DocItem[]>();
    (docRows ?? []).forEach((d) => {
      const list = docsByCase.get(d.case_id) ?? [];
      list.push({ key: d.doc_key, label: d.label, required: d.required, status: d.status, history: [] });
      docsByCase.set(d.case_id, list);
    });
    const notesByCase = new Map<string, SnapCase["notes"]>();
    (noteRows ?? []).forEach((n) => {
      const list = notesByCase.get(n.case_id) ?? [];
      list.push({ id: n.id, at: n.created_at, by: n.author, text: n.body });
      notesByCase.set(n.case_id, list);
    });

    const cases: SnapCase[] = (caseRows ?? []).map((c) => ({
      id: c.external_id,
      applicantLabel: c.applicant_label,
      countyId: c.county_id,
      applicationDate: c.application_date,
      status: c.status as CaseStatus,
      expedited: c.expedited,
      householdSize: c.household_size,
      monthlyIncome: Number(c.monthly_income),
      monthlyExpenses: Number(c.monthly_expenses),
      assignedWorkerId: c.assigned_worker_id ?? undefined,
      vulnerabilityFlags: c.vulnerability_flags ?? [],
      documents: docsByCase.get(c.id) ?? [],
      notes: notesByCase.get(c.id) ?? [],
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    const audit: AuditEntry[] = (auditRows ?? []).map((a) => ({
      id: a.id,
      at: a.at,
      userId: a.user_id,
      caseId: a.case_external_id,
      countyId: a.county_id,
      action: a.action,
      prev: a.prev ?? undefined,
      next: a.next ?? undefined,
      systemNote: a.system_note ?? undefined,
      automated: a.automated,
    }));

    return {
      version: 1,
      activeCountyId: counties[2]?.id ?? counties[0]?.id ?? "cty_wake",
      role: "Supervisor",
      currentUser: p.userName,
      counties,
      workers,
      cases,
      audit,
      prescreenConfig: DEFAULT_PRESCREEN_CONFIG,
    };
  } catch {
    return null;
  }
}

async function caseUuid(supabase: SupabaseClient, externalId: string): Promise<string | null> {
  const { data } = await supabase.from("bk_cases").select("id").eq("external_id", externalId).maybeSingle();
  return data?.id ?? null;
}

async function writeAudit(
  supabase: SupabaseClient,
  p: BacklogPrincipal,
  e: { action: string; caseExternalId?: string; countyId?: string; prev?: string; next?: string; systemNote?: string; automated?: boolean },
) {
  await supabase.from("bk_audit").insert({
    owner_user_id: p.userId,
    user_id: p.userName,
    case_external_id: e.caseExternalId ?? "-",
    county_id: e.countyId ?? "-",
    action: e.action,
    prev: e.prev ?? null,
    next: e.next ?? null,
    system_note: e.systemNote ?? null,
    automated: e.automated ?? false,
  });
}

/** Apply one mutation for the signed-in owner. Returns false if not server-backed. */
export async function applyBacklogAction(action: BacklogAction): Promise<boolean> {
  const p = await principal();
  if (!p) return false;
  const supabase = await createSupabaseServerClient();

  switch (action.kind) {
    case "import": {
      for (const c of action.cases) {
        const { data: inserted } = await supabase
          .from("bk_cases")
          .upsert(
            {
              owner_user_id: p.userId,
              external_id: c.id,
              applicant_label: c.applicantLabel,
              county_id: c.countyId,
              application_date: c.applicationDate,
              status: c.status,
              expedited: c.expedited,
              household_size: c.householdSize,
              monthly_income: c.monthlyIncome,
              monthly_expenses: c.monthlyExpenses,
              assigned_worker_id: c.assignedWorkerId ?? null,
              vulnerability_flags: c.vulnerabilityFlags,
            },
            { onConflict: "owner_user_id,external_id" },
          )
          .select("id")
          .maybeSingle();
        if (inserted?.id) {
          await supabase.from("bk_case_documents").upsert(
            c.documents.map((d) => ({ owner_user_id: p.userId, case_id: inserted.id, doc_key: d.key, label: d.label, required: d.required, status: d.status })),
            { onConflict: "case_id,doc_key" },
          );
        }
        await writeAudit(supabase, p, { action: "Case created", caseExternalId: c.id, countyId: c.countyId, next: c.status });
      }
      await writeAudit(supabase, p, { action: "CSV uploaded", systemNote: `Imported ${action.cases.length} case(s) from CSV.` });
      return true;
    }
    case "assignWorker": {
      await supabase.from("bk_cases").update({ assigned_worker_id: action.workerId || null, updated_at: new Date().toISOString() }).eq("external_id", action.caseExternalId);
      await writeAudit(supabase, p, { action: "Worker assigned", caseExternalId: action.caseExternalId, next: action.workerId });
      return true;
    }
    case "setStatus": {
      await supabase.from("bk_cases").update({ status: action.status, updated_at: new Date().toISOString() }).eq("external_id", action.caseExternalId);
      await writeAudit(supabase, p, { action: "Status changed", caseExternalId: action.caseExternalId, next: action.status });
      return true;
    }
    case "closeCase": {
      await supabase.from("bk_cases").update({ status: "Completed", updated_at: new Date().toISOString() }).eq("external_id", action.caseExternalId);
      await writeAudit(supabase, p, { action: "Case reviewed/closed", caseExternalId: action.caseExternalId, next: "Completed" });
      return true;
    }
    case "setDocStatus": {
      const id = await caseUuid(supabase, action.caseExternalId);
      if (id) {
        const { data: doc } = await supabase.from("bk_case_documents").update({ status: action.status, updated_at: new Date().toISOString() }).eq("case_id", id).eq("doc_key", action.docKey).select("id").maybeSingle();
        if (doc?.id) await supabase.from("bk_document_events").insert({ owner_user_id: p.userId, document_id: doc.id, status: action.status, by_user: action.by });
      }
      await writeAudit(supabase, p, { action: "Document status changed", caseExternalId: action.caseExternalId, next: `${action.docKey}: ${action.status}` });
      return true;
    }
    case "addNote": {
      const id = await caseUuid(supabase, action.caseExternalId);
      if (id) await supabase.from("bk_notes").insert({ owner_user_id: p.userId, case_id: id, body: action.text, author: action.author });
      await writeAudit(supabase, p, { action: "Note added", caseExternalId: action.caseExternalId, next: action.text.slice(0, 80) });
      return true;
    }
    case "audit": {
      await writeAudit(supabase, p, action);
      return true;
    }
    default:
      return false;
  }
}
