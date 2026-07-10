import type { Alert, AlertSeverity, AlertType, CaseView, Worker } from "@/lib/backlog/types";

const WORKER_OVERLOAD_THRESHOLD = 8;

// Alerts derived deterministically from current case + worker state. In-app only for Phase 1.
export function computeAlerts(views: CaseView[], workers: Worker[], now: Date = new Date()): Alert[] {
  const alerts: Alert[] = [];
  const stamp = now.toISOString();
  const push = (type: AlertType, severity: AlertSeverity, message: string, countyId: string, caseId?: string) =>
    alerts.push({ id: `al_${type}_${caseId || countyId}_${alerts.length}`, type, severity, message, countyId, caseId, at: stamp });

  for (const v of views) {
    if (v.status === "Completed") continue;
    if (v.daysUntilDeadline < 0) {
      push("Overdue case", v.expedited ? "Critical" : "High", `${v.applicantLabel} is ${Math.abs(v.daysUntilDeadline)} day(s) overdue.`, v.countyId, v.id);
    } else if (v.deadlineRisk === "High") {
      push("Deadline approaching", v.expedited ? "High" : "Medium", `${v.applicantLabel} has ${v.daysUntilDeadline} day(s) until deadline.`, v.countyId, v.id);
    }
    if (v.expedited && v.status !== "Ready for Review" && v.daysUntilDeadline <= 3) {
      push("Expedited case needs review", "Critical", `Expedited case ${v.applicantLabel} needs worker review within ${Math.max(0, v.daysUntilDeadline)} day(s).`, v.countyId, v.id);
    }
    if (v.missingRequiredDocs.length > 0) {
      push("Missing document blocker", v.missingRequiredDocs.length >= 2 ? "High" : "Medium", `${v.applicantLabel} is blocked on ${v.missingRequiredDocs.length} required document(s).`, v.countyId, v.id);
    }
  }

  const openByWorker: Record<string, number> = {};
  for (const v of views) {
    if (v.status === "Completed" || !v.assignedWorkerId) continue;
    openByWorker[v.assignedWorkerId] = (openByWorker[v.assignedWorkerId] || 0) + 1;
  }
  for (const w of workers) {
    const load = openByWorker[w.id] || 0;
    if (load > WORKER_OVERLOAD_THRESHOLD) {
      push("Worker overload", load > WORKER_OVERLOAD_THRESHOLD + 4 ? "High" : "Medium", `${w.name} is carrying ${load} open cases (threshold ${WORKER_OVERLOAD_THRESHOLD}).`, w.countyId);
    }
  }

  const byCounty: Record<string, { recent: number; prior: number }> = {};
  for (const v of views) {
    const b = (byCounty[v.countyId] = byCounty[v.countyId] || { recent: 0, prior: 0 });
    if (v.daysPending <= 7) b.recent++;
    else if (v.daysPending <= 14) b.prior++;
  }
  for (const [countyId, b] of Object.entries(byCounty)) {
    if (b.recent >= 3 && b.recent > b.prior * 1.5) {
      push("Backlog spike", "High", `New applications up sharply this week (${b.recent} vs ${b.prior} prior week).`, countyId);
    }
  }

  const order: Record<AlertSeverity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}
