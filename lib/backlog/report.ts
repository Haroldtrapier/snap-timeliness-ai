import type { CaseView, County } from "@/lib/backlog/types";
import { computeMetrics, weeklyTrend, type CountyMetrics } from "@/lib/backlog/metrics";

export type ReportType =
  | "Daily backlog report"
  | "Weekly leadership report"
  | "Case aging report"
  | "Priority queue report";

export interface ReportModel {
  type: ReportType;
  countyName: string;
  generatedAt: string;
  metrics: CountyMetrics;
  trend: { thisWeek: number; lastWeek: number; delta: number };
  recommendedActions: string[];
  topPriority: CaseView[];
  agingBuckets: { label: string; count: number }[];
}

export function buildReport(type: ReportType, county: County | undefined, views: CaseView[]): ReportModel {
  const metrics = computeMetrics(views);
  const trend = weeklyTrend(views);
  const open = views.filter((v) => v.status !== "Completed");
  const topPriority = [...open].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 10);

  const agingBuckets = [
    { label: "0–7 days", count: open.filter((v) => v.daysPending <= 7).length },
    { label: "8–14 days", count: open.filter((v) => v.daysPending > 7 && v.daysPending <= 14).length },
    { label: "15–21 days", count: open.filter((v) => v.daysPending > 14 && v.daysPending <= 21).length },
    { label: "22–30 days", count: open.filter((v) => v.daysPending > 21 && v.daysPending <= 30).length },
    { label: "30+ days", count: open.filter((v) => v.daysPending > 30).length },
  ];

  const recommendedActions: string[] = [];
  if (metrics.overdue > 0) recommendedActions.push(`Immediately assign ${metrics.overdue} overdue case(s) for same-day worker review.`);
  const expeditedAtRisk = open.filter((v) => v.expedited && v.daysUntilDeadline <= 3).length;
  if (expeditedAtRisk > 0) recommendedActions.push(`Escalate ${expeditedAtRisk} expedited case(s) at risk of missing the 7-day standard.`);
  if (metrics.missingDocs > 0) recommendedActions.push(`Send document-request notices for ${metrics.missingDocs} case(s) blocked on required verification.`);
  if (metrics.nearDeadline > 0) recommendedActions.push(`Prioritize ${metrics.nearDeadline} case(s) within 3 days of their processing deadline.`);
  if (metrics.readyForReview > 0) recommendedActions.push(`${metrics.readyForReview} case(s) are ready for final worker review — clear these to reduce backlog.`);
  if (metrics.backlogRiskLabel === "Critical" || metrics.backlogRiskLabel === "High")
    recommendedActions.push("Consider redistributing caseload; backlog risk is elevated this period.");
  if (recommendedActions.length === 0)
    recommendedActions.push("Backlog is within healthy timeliness ranges. Maintain current review cadence.");

  return {
    type,
    countyName: county ? `${county.name}, ${county.state}` : "All Counties",
    generatedAt: new Date().toISOString(),
    metrics,
    trend,
    recommendedActions,
    topPriority,
    agingBuckets,
  };
}
