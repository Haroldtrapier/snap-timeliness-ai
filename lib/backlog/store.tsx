"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
  AuditAction,
  AuditEntry,
  BacklogRole,
  BacklogState,
  CaseView,
  CaseStatus,
  DocStatus,
  PrescreenConfig,
  SnapCase,
} from "@/lib/backlog/types";
import { makeSeedState } from "@/lib/backlog/seed";
import { toView } from "@/lib/backlog/derive";
import { computeMetrics, weeklyTrend, type CountyMetrics } from "@/lib/backlog/metrics";
import { computeAlerts } from "@/lib/backlog/alerts";
import { rowsToCases, type ImportRow } from "@/lib/backlog/csv";
import type { BacklogAction } from "@/lib/backlog/actions";

const STORAGE_KEY = "snap_backlog_state_v1";
const API = "/app/agency/backlog/api";

function loadState(): BacklogState {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BacklogState;
        if (parsed && parsed.version === 1 && Array.isArray(parsed.cases)) return parsed;
      }
    } catch {
      /* ignore */
    }
  }
  return makeSeedState();
}

function persistLocal(state: BacklogState) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
}

let auditSeq = 0;
function uid(prefix: string) {
  auditSeq += 1;
  return `${prefix}_${Date.now()}_${auditSeq}`;
}

interface BacklogContextValue {
  ready: boolean;
  backed: boolean;
  state: BacklogState;
  now: Date;
  views: CaseView[];
  allViews: CaseView[];
  metrics: CountyMetrics;
  trend: { thisWeek: number; lastWeek: number; delta: number };
  alerts: ReturnType<typeof computeAlerts>;
  activeWorkers: BacklogState["workers"];
  getCase: (id: string) => CaseView | undefined;
  setActiveCounty: (id: string) => void;
  setRole: (role: BacklogRole) => void;
  importCases: (rows: ImportRow[]) => number;
  assignWorker: (caseId: string, workerId: string) => void;
  setStatus: (caseId: string, status: CaseStatus) => void;
  setDocStatus: (caseId: string, docKey: string, status: DocStatus) => void;
  addNote: (caseId: string, text: string) => void;
  closeCase: (caseId: string) => void;
  logAudit: (action: AuditAction, caseId: string, extra?: Partial<AuditEntry>) => void;
  updatePrescreenConfig: (cfg: PrescreenConfig) => void;
  resetDemo: () => void;
}

const BacklogContext = createContext<BacklogContextValue | null>(null);

function makeAudit(s: BacklogState, action: AuditAction, caseId: string, extra: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id: uid("aud"),
    at: new Date().toISOString(),
    userId: s.currentUser,
    caseId,
    countyId: extra.countyId ?? s.cases.find((c) => c.id === caseId)?.countyId ?? s.activeCountyId,
    action,
    ...extra,
  };
}

export function BacklogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BacklogState | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const [backed, setBacked] = useState(false);
  const backedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API, { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && json?.backed && json?.state) {
          backedRef.current = true;
          setBacked(true);
          setState(json.state as BacklogState);
          setNow(new Date());
          return;
        }
      } catch {
        /* fall through to local demo */
      }
      if (!cancelled) {
        setState(loadState());
        setNow(new Date());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fire-and-forget server sync; a reload re-hydrates from the server of record.
  const sync = useCallback((action: BacklogAction) => {
    if (!backedRef.current) return;
    void fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action) }).catch(() => {});
  }, []);

  const commit = useCallback((next: BacklogState) => {
    if (!backedRef.current) persistLocal(next);
    setState(next);
  }, []);

  const mutateCase = useCallback(
    (caseId: string, fn: (c: SnapCase) => SnapCase, audits: (after: SnapCase, before: SnapCase) => AuditEntry[]) => {
      setState((prev) => {
        if (!prev) return prev;
        const idx = prev.cases.findIndex((c) => c.id === caseId);
        if (idx < 0) return prev;
        const before = prev.cases[idx];
        const after = { ...fn(before), updatedAt: new Date().toISOString() };
        const cases = [...prev.cases];
        cases[idx] = after;
        const next: BacklogState = { ...prev, cases, audit: [...audits(after, before), ...prev.audit] };
        if (!backedRef.current) persistLocal(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo<BacklogContextValue | null>(() => {
    if (!state) return null;
    const cfg = state.prescreenConfig;
    const allViews = state.cases.map((c) => toView(c, cfg, state.counties, state.workers, now));
    const views = allViews.filter((v) => v.countyId === state.activeCountyId);
    const metrics = computeMetrics(views);
    const trend = weeklyTrend(views);
    const alerts = computeAlerts(views, state.workers.filter((w) => w.countyId === state.activeCountyId), now);
    const activeWorkers = state.workers.filter((w) => w.countyId === state.activeCountyId);

    return {
      ready: true,
      backed,
      state,
      now,
      views,
      allViews,
      metrics,
      trend,
      alerts,
      activeWorkers,
      getCase: (id) => allViews.find((v) => v.id === id),
      setActiveCounty: (id) => commit({ ...state, activeCountyId: id }),
      setRole: (role) => commit({ ...state, role }),
      importCases: (rows) => {
        const newCases = rowsToCases(rows, state.counties, new Date());
        if (newCases.length === 0) return 0;
        const audit: AuditEntry[] = [
          makeAudit(state, "CSV uploaded", "-", { systemNote: `Imported ${newCases.length} case(s) from CSV.`, automated: false }),
          ...newCases.map((c) => makeAudit(state, "Case created", c.id, { countyId: c.countyId, next: c.status })),
          ...newCases.map((c) =>
            makeAudit(state, "Missing document checklist generated", c.id, {
              countyId: c.countyId,
              automated: true,
              systemNote: "Checklist auto-generated on import.",
            }),
          ),
        ];
        commit({ ...state, cases: [...newCases, ...state.cases], audit: [...audit, ...state.audit] });
        sync({ kind: "import", cases: newCases });
        return newCases.length;
      },
      assignWorker: (caseId, workerId) => {
        mutateCase(
          caseId,
          (c) => ({ ...c, assignedWorkerId: workerId }),
          (after, before) => [
            makeAudit(state, "Worker assigned", caseId, {
              countyId: after.countyId,
              prev: state.workers.find((w) => w.id === before.assignedWorkerId)?.name || "Unassigned",
              next: state.workers.find((w) => w.id === workerId)?.name || "Unassigned",
            }),
          ],
        );
        sync({ kind: "assignWorker", caseExternalId: caseId, workerId });
      },
      setStatus: (caseId, status) => {
        mutateCase(
          caseId,
          (c) => ({ ...c, status }),
          (after, before) => [makeAudit(state, "Status changed", caseId, { countyId: after.countyId, prev: before.status, next: status })],
        );
        sync({ kind: "setStatus", caseExternalId: caseId, status });
      },
      setDocStatus: (caseId, docKey, status) => {
        mutateCase(
          caseId,
          (c) => ({
            ...c,
            documents: c.documents.map((d) =>
              d.key === docKey ? { ...d, status, history: [...d.history, { status, at: new Date().toISOString(), by: state.currentUser }] } : d,
            ),
          }),
          (after, before) => {
            const b = before.documents.find((d) => d.key === docKey);
            const a = after.documents.find((d) => d.key === docKey);
            return [
              makeAudit(state, "Document status changed", caseId, {
                countyId: after.countyId,
                prev: `${b?.label}: ${b?.status}`,
                next: `${a?.label}: ${status}`,
              }),
            ];
          },
        );
        sync({ kind: "setDocStatus", caseExternalId: caseId, docKey, status, by: state.currentUser });
      },
      addNote: (caseId, text) => {
        mutateCase(
          caseId,
          (c) => ({ ...c, notes: [{ id: uid("note"), at: new Date().toISOString(), by: state.currentUser, text }, ...c.notes] }),
          (after) => [makeAudit(state, "Note added", caseId, { countyId: after.countyId, next: text.slice(0, 80) })],
        );
        sync({ kind: "addNote", caseExternalId: caseId, text, author: state.currentUser });
      },
      closeCase: (caseId) => {
        mutateCase(
          caseId,
          (c) => ({ ...c, status: "Completed" }),
          (after, before) => [makeAudit(state, "Case reviewed/closed", caseId, { countyId: after.countyId, prev: before.status, next: "Completed" })],
        );
        sync({ kind: "closeCase", caseExternalId: caseId });
      },
      logAudit: (action, caseId, extra) => {
        commit({ ...state, audit: [makeAudit(state, action, caseId, extra), ...state.audit] });
        sync({ kind: "audit", action, caseExternalId: caseId, countyId: extra?.countyId, prev: extra?.prev, next: extra?.next, systemNote: extra?.systemNote, automated: extra?.automated });
      },
      updatePrescreenConfig: (newCfg) => commit({ ...state, prescreenConfig: newCfg }),
      resetDemo: () => {
        if (backedRef.current) return; // demo-only affordance
        commit(makeSeedState(new Date()));
      },
    };
  }, [state, now, backed, commit, mutateCase, sync]);

  if (!value) {
    return (
      <div className="bk-loading">
        <div className="bk-spinner" />
        <p>Loading SNAP AI Backlog Command Center…</p>
      </div>
    );
  }
  return <BacklogContext.Provider value={value}>{children}</BacklogContext.Provider>;
}

export function useBacklog(): BacklogContextValue {
  const ctx = useContext(BacklogContext);
  if (!ctx) throw new Error("useBacklog must be used within BacklogProvider");
  return ctx;
}
