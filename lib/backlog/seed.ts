import type { BacklogState, County, DocItem, DocStatus, SnapCase, CaseStatus, Worker } from "@/lib/backlog/types";
import { STANDARD_DOCUMENTS, DEFAULT_PRESCREEN_CONFIG } from "@/lib/backlog/config";
import { anonymize } from "@/lib/backlog/csv";

// All demo data is fictional and anonymized. No real applicant data is used.
export const SEED_COUNTIES: County[] = [
  { id: "cty_cumberland", name: "Cumberland County", state: "NC" },
  { id: "cty_mecklenburg", name: "Mecklenburg County", state: "NC" },
  { id: "cty_wake", name: "Wake County", state: "NC" },
  { id: "cty_guilford", name: "Guilford County", state: "NC" },
  { id: "cty_durham", name: "Durham County", state: "NC" },
  { id: "cty_forsyth", name: "Forsyth County", state: "NC" },
];

const WORKER_NAMES = [
  "Alicia Monroe",
  "Darnell Price",
  "Priya Raman",
  "Marcus Bell",
  "Elena Vasquez",
  "Tomás Reyes",
];

export const SEED_WORKERS: Worker[] = SEED_COUNTIES.flatMap((c, ci) => {
  const sup = WORKER_NAMES[ci % WORKER_NAMES.length];
  const cw1 = WORKER_NAMES[(ci + 1) % WORKER_NAMES.length];
  const cw2 = WORKER_NAMES[(ci + 2) % WORKER_NAMES.length];
  return [
    { id: `wk_${c.id}_sup`, name: sup, role: "Supervisor", countyId: c.id, title: "DSS Supervisor" },
    { id: `wk_${c.id}_a`, name: cw1, role: "Caseworker", countyId: c.id, title: "Eligibility Caseworker" },
    { id: `wk_${c.id}_b`, name: cw2, role: "Caseworker", countyId: c.id, title: "Eligibility Caseworker" },
  ] as Worker[];
});

// Small seeded PRNG for stable-but-varied demo data.
function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const VULN = ["Elderly", "Disabled", "Child under 6", "Pregnant", "Homeless", "Veteran"];

function docsFor(rand: () => number, expedited: boolean): DocItem[] {
  const now = new Date().toISOString();
  return STANDARD_DOCUMENTS.map((d) => {
    const roll = rand();
    let status: DocStatus = "Verified";
    if (roll < 0.2) status = "Missing";
    else if (roll < 0.32) status = "Requested";
    else if (roll < 0.55) status = "Received";
    if (expedited && d.key === "proof_of_income" && rand() < 0.5) status = "Missing";
    return { key: d.key, label: d.label, required: d.required, status, history: [{ status, at: now, by: "system" }] };
  });
}

export function makeSeedCases(now: Date = new Date()): SnapCase[] {
  const rand = prng(20260710);
  const cases: SnapCase[] = [];
  let n = 1000;

  for (const county of SEED_COUNTIES) {
    const count = 7 + Math.floor(rand() * 3);
    const workers = SEED_WORKERS.filter((w) => w.countyId === county.id);
    for (let i = 0; i < count; i++) {
      n++;
      const caseId = `SNAP-${n}`;
      const expedited = rand() < 0.28;
      const daysAgo = 1 + Math.floor(rand() * 38);
      const applied = new Date(now);
      applied.setDate(applied.getDate() - daysAgo);
      const householdSize = 1 + Math.floor(rand() * 6);
      const baseIncome = 700 + Math.floor(rand() * 3200);
      const monthlyIncome = baseIncome;
      const monthlyExpenses = Math.floor(baseIncome * (0.5 + rand() * 0.45));
      const flags: string[] = [];
      if (rand() < 0.35) flags.push(VULN[Math.floor(rand() * VULN.length)]);
      if (rand() < 0.12) flags.push(VULN[Math.floor(rand() * VULN.length)]);
      const documents = docsFor(rand, expedited);
      const missingRequired = documents.some((d) => d.required && (d.status === "Missing" || d.status === "Requested"));

      let status: CaseStatus;
      const sla = expedited ? 7 : 30;
      if (daysAgo > sla) status = "Overdue";
      else if (expedited) status = "Expedited Review";
      else if (missingRequired) status = "Missing Documents";
      else if (rand() < 0.25) status = "Ready for Review";
      else status = rand() < 0.5 ? "Pending Review" : "New";
      if (rand() < 0.08) status = "Completed";

      const worker = rand() < 0.85 ? workers[Math.floor(rand() * workers.length)] : undefined;
      const iso = applied.toISOString();
      cases.push({
        id: caseId,
        applicantLabel: anonymize(caseId),
        countyId: county.id,
        applicationDate: iso,
        status,
        expedited,
        householdSize,
        monthlyIncome,
        monthlyExpenses,
        assignedWorkerId: worker?.id,
        vulnerabilityFlags: Array.from(new Set(flags)),
        documents,
        notes: [],
        createdAt: iso,
        updatedAt: iso,
      });
    }
  }
  return cases;
}

export function makeSeedState(now: Date = new Date()): BacklogState {
  return {
    version: 1,
    activeCountyId: SEED_COUNTIES[2].id,
    role: "Supervisor",
    currentUser: "demo.supervisor",
    counties: SEED_COUNTIES,
    workers: SEED_WORKERS,
    cases: makeSeedCases(now),
    audit: [
      {
        id: "aud_seed",
        at: now.toISOString(),
        userId: "system",
        caseId: "-",
        countyId: "-",
        action: "Demo data reset",
        systemNote: "Seeded fictional demo data for all counties.",
        automated: true,
      },
    ],
    prescreenConfig: DEFAULT_PRESCREEN_CONFIG,
  };
}
