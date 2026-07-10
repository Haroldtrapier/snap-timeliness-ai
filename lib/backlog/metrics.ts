import type { CaseView, RiskLabel } from "@/lib/backlog/types";

export interface CountyMetrics {
  totalPending: number;
  expedited: number;
  overdue: number;
  nearDeadline: number;
  missingDocs: number;
  readyForReview: number;
  completed: number;
  avgDaysPending: number;
  backlogRiskScore: number;
  backlogRiskLabel: RiskLabel;
  timelinessScore: number;
}

const OPEN_STATUSES = new Set<string>([
  "New",
  "Pending Review",
  "Missing Documents",
  "Expedited Review",
  "Ready for Review",
  "Overdue",
]);

export function computeMetrics(views: CaseView[]): CountyMetrics {
  const open = views.filter((v) => OPEN_STATUSES.has(v.status));
  const totalPending = open.length;
  const expedited = open.filter((v) => v.expedited).length;
  const overdue = open.filter((v) => v.daysUntilDeadline < 0).length;
  const nearDeadline = open.filter((v) => v.daysUntilDeadline >= 0 && v.deadlineRisk === "High").length;
  const missingDocs = open.filter((v) => v.missingRequiredDocs.length > 0).length;
  const readyForReview = open.filter((v) => v.status === "Ready for Review").length;
  const completed = views.filter((v) => v.status === "Completed").length;
  const avgDaysPending =
    totalPending === 0 ? 0 : Math.round(open.reduce((a, v) => a + v.daysPending, 0) / totalPending);

  let risk = 0;
  if (totalPending > 0) {
    const overdueShare = overdue / totalPending;
    const nearShare = nearDeadline / totalPending;
    const expeditedOverdue = open.filter((v) => v.expedited && v.daysUntilDeadline < 0).length / totalPending;
    const docShare = missingDocs / totalPending;
    risk = Math.round(
      Math.min(
        100,
        overdueShare * 45 + nearShare * 20 + expeditedOverdue * 20 + docShare * 15 + Math.min(1, avgDaysPending / 30) * 20,
      ),
    );
  }
  const backlogRiskLabel: RiskLabel = risk >= 70 ? "Critical" : risk >= 45 ? "High" : risk >= 20 ? "Medium" : "Low";
  const timelinessScore = Math.max(0, 100 - risk);

  return {
    totalPending,
    expedited,
    overdue,
    nearDeadline,
    missingDocs,
    readyForReview,
    completed,
    avgDaysPending,
    backlogRiskScore: risk,
    backlogRiskLabel,
    timelinessScore,
  };
}

export function weeklyTrend(views: CaseView[]): { thisWeek: number; lastWeek: number; delta: number } {
  const thisWeek = views.filter((v) => v.daysPending <= 7).length;
  const lastWeek = views.filter((v) => v.daysPending > 7 && v.daysPending <= 14).length;
  return { thisWeek, lastWeek, delta: thisWeek - lastWeek };
}
