import type {
  SnapCase,
  CaseView,
  CaseStatus,
  RiskLabel,
  PriorityTag,
  PrescreenCategory,
  PrescreenConfig,
  County,
  Worker,
  DocItem,
} from "@/lib/backlog/types";

const DAY = 1000 * 60 * 60 * 24;

export function daysBetween(from: string | Date, to: string | Date): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.floor((b - a) / DAY);
}

export function deadlineFor(c: SnapCase, cfg: PrescreenConfig): string {
  const sla = c.expedited ? cfg.expeditedSlaDays : cfg.standardSlaDays;
  const d = new Date(c.applicationDate);
  d.setDate(d.getDate() + sla);
  return d.toISOString();
}

export function deadlineRiskFrom(daysUntilDeadline: number, cfg: PrescreenConfig): RiskLabel {
  if (daysUntilDeadline < 0) return "Critical";
  if (daysUntilDeadline <= cfg.nearDeadlineDays) return "High";
  if (daysUntilDeadline <= 7) return "Medium";
  return "Low";
}

function grossLimit(size: number, cfg: PrescreenConfig): number {
  const v = cfg.grossMonthlyIncomeLimit[size];
  if (v != null) return v;
  return cfg.grossMonthlyIncomeLimit[8] + (size - 8) * cfg.additionalMemberGross;
}

function netLimit(size: number, cfg: PrescreenConfig): number {
  const v = cfg.netMonthlyIncomeLimit[size];
  if (v != null) return v;
  return cfg.netMonthlyIncomeLimit[8] + (size - 8) * cfg.additionalMemberNet;
}

// Eligibility PRE-SCREEN — decision support only. Never approves or denies.
export function prescreen(
  c: SnapCase,
  cfg: PrescreenConfig,
  missingRequired: DocItem[],
): { category: PrescreenCategory; notes: string[] } {
  const notes: string[] = [];
  const gLimit = grossLimit(c.householdSize, cfg);
  const nLimit = netLimit(c.householdSize, cfg);
  const netIncome = Math.max(0, c.monthlyIncome - c.monthlyExpenses);

  const idOrIncomeMissing = missingRequired.some(
    (d) => d.key === "id_verification" || d.key === "proof_of_income" || d.key === "pay_stubs",
  );

  if (idOrIncomeMissing) {
    notes.push("Identity and/or income verification is not yet on file, so eligibility cannot be assessed.");
    notes.push(`Household of ${c.householdSize}: gross income $${c.monthlyIncome}/mo reported.`);
    return { category: "Missing information", notes };
  }

  notes.push(`Household size ${c.householdSize}. Gross income limit ~$${gLimit}/mo, net limit ~$${nLimit}/mo.`);
  notes.push(`Reported gross $${c.monthlyIncome}/mo, estimated net $${netIncome}/mo after reported expenses.`);

  if (c.monthlyIncome > gLimit * 1.15) {
    notes.push("Reported gross income appears to exceed the gross income limit by a wide margin — worker should confirm income and any exclusions.");
    return { category: "Potential issue found", notes };
  }

  if (c.monthlyIncome <= gLimit && netIncome <= nLimit) {
    if (c.expedited) notes.push("Expedited indicators present — federal 7-day processing standard applies.");
    notes.push("Reported income falls within screening thresholds. Worker must verify documents and finalize.");
    return { category: "Likely eligible — worker review required", notes };
  }

  notes.push("Reported income is near the threshold or net calculation is borderline — needs full worker review.");
  return { category: "Needs review", notes };
}

interface ScoreInput {
  expedited: boolean;
  daysUntilDeadline: number;
  status: CaseStatus;
  vulnerabilityFlags: string[];
  missingRequiredDocs: DocItem[];
  cfg: PrescreenConfig;
}

// Priority scoring — every score carries an explanation and visual tags.
export function scoreCase(v: ScoreInput): {
  score: number;
  band: RiskLabel;
  tags: PriorityTag[];
  explanation: string;
} {
  const reasons: string[] = [];
  const tags: PriorityTag[] = [];
  let score = 10;

  if (v.expedited) {
    score += 40;
    tags.push("Expedited");
    reasons.push("case is flagged expedited");
  }
  if (v.daysUntilDeadline < 0) {
    score += 35;
    tags.push("Overdue");
    reasons.push(`${Math.abs(v.daysUntilDeadline)} day(s) overdue`);
  } else if (v.daysUntilDeadline <= v.cfg.nearDeadlineDays) {
    score += 25;
    tags.push("Near Deadline");
    reasons.push(`${v.daysUntilDeadline} day(s) until deadline`);
  } else if (v.daysUntilDeadline <= 7) {
    score += 12;
    reasons.push(`${v.daysUntilDeadline} days until deadline`);
  }

  if (v.vulnerabilityFlags.length > 0) {
    score += Math.min(15, v.vulnerabilityFlags.length * 8);
    tags.push("Vulnerable Household");
    reasons.push(`vulnerable household (${v.vulnerabilityFlags.join(", ")})`);
  }

  if (v.missingRequiredDocs.length > 0) {
    score += 12;
    tags.push("Missing Documents");
    reasons.push(`${v.missingRequiredDocs.length} required document(s) still missing`);
  }

  if (v.status === "Ready for Review") {
    score += 20;
    tags.push("Ready for Review");
    reasons.push("case is ready for worker review");
  }

  tags.push("Worker Review Required");
  score = Math.max(0, Math.min(100, score));

  const band: RiskLabel = score >= 75 ? "Critical" : score >= 50 ? "High" : score >= 30 ? "Medium" : "Low";
  const explanation =
    reasons.length === 0
      ? "Standard priority — no urgent indicators. Worker review required."
      : `${band} priority because ${reasons.join(", and ")}. Worker review required.`;

  return { score, band, tags, explanation };
}

export function toView(
  c: SnapCase,
  cfg: PrescreenConfig,
  counties: County[],
  workers: Worker[],
  now: Date = new Date(),
): CaseView {
  const deadlineDate = deadlineFor(c, cfg);
  const daysPending = Math.max(0, daysBetween(c.applicationDate, now));
  const daysUntilDeadline = daysBetween(now, deadlineDate);
  const deadlineRisk = deadlineRiskFrom(daysUntilDeadline, cfg);
  const missingDocs = c.documents.filter((d) => d.status === "Missing" || d.status === "Requested");
  const missingRequiredDocs = missingDocs.filter((d) => d.required);
  const pr = scoreCase({
    expedited: c.expedited,
    daysUntilDeadline,
    status: c.status,
    vulnerabilityFlags: c.vulnerabilityFlags,
    missingRequiredDocs,
    cfg,
  });
  const ps = prescreen(c, cfg, missingRequiredDocs);

  return {
    ...c,
    daysPending,
    deadlineDate,
    daysUntilDeadline,
    deadlineRisk,
    missingDocs,
    missingRequiredDocs,
    priorityScore: pr.score,
    priorityBand: pr.band,
    priorityTags: pr.tags,
    priorityExplanation: pr.explanation,
    prescreen: ps,
    county: counties.find((x) => x.id === c.countyId),
    worker: workers.find((w) => w.id === c.assignedWorkerId),
  };
}
