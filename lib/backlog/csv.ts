import type { County, DocItem, DocStatus, SnapCase, CaseStatus } from "@/lib/backlog/types";
import { STANDARD_DOCUMENTS } from "@/lib/backlog/config";

// Minimal RFC-4180-ish CSV parser (handles quoted fields, commas, and newlines).
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export const REQUIRED_COLUMNS = ["case_id", "county", "application_date", "household_size", "monthly_income"];
export const OPTIONAL_COLUMNS = [
  "applicant_name",
  "monthly_expenses",
  "expedited",
  "status",
  "assigned_worker",
  "vulnerability_flags",
  "missing_documents",
];

export interface ImportRow {
  raw: Record<string, string>;
  rowNumber: number;
  errors: string[];
  duplicate: boolean;
  caseId: string;
}

export interface ImportPreview {
  headers: string[];
  missingColumns: string[];
  rows: ImportRow[];
  validCount: number;
  errorCount: number;
  duplicateCount: number;
}

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

export function buildPreview(text: string, existingCaseIds: Set<string>): ImportPreview {
  const grid = parseCsv(text);
  if (grid.length === 0) {
    return { headers: [], missingColumns: REQUIRED_COLUMNS, rows: [], validCount: 0, errorCount: 0, duplicateCount: 0 };
  }
  const headers = grid[0].map(normHeader);
  const missingColumns = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  const rows: ImportRow[] = [];
  const seenInFile = new Set<string>();

  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r];
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => (raw[h] = (cells[i] ?? "").trim()));
    const errors: string[] = [];
    const caseId = raw["case_id"] || "";

    for (const col of missingColumns) errors.push(`Missing required column "${col}"`);
    if (!caseId) errors.push("case_id is required");
    if (!raw["county"]) errors.push("county is required");
    if (!raw["application_date"] || isNaN(new Date(raw["application_date"]).getTime()))
      errors.push("application_date is missing or invalid (use YYYY-MM-DD)");
    if (!raw["household_size"] || isNaN(Number(raw["household_size"])) || Number(raw["household_size"]) < 1)
      errors.push("household_size must be a positive number");
    if (raw["monthly_income"] === "" || isNaN(Number(raw["monthly_income"]))) errors.push("monthly_income must be a number");

    let duplicate = false;
    if (caseId) {
      if (existingCaseIds.has(caseId) || seenInFile.has(caseId)) {
        duplicate = true;
        errors.push(`Duplicate case_id "${caseId}" (already imported or repeated in file)`);
      }
      seenInFile.add(caseId);
    }

    rows.push({ raw, rowNumber: r + 1, errors, duplicate, caseId });
  }

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const errorCount = rows.filter((r) => r.errors.length > 0 && !r.duplicate).length;
  const duplicateCount = rows.filter((r) => r.duplicate).length;
  return { headers, missingColumns, rows, validCount, errorCount, duplicateCount };
}

function makeDocuments(missingCsv: string): DocItem[] {
  const flagged = missingCsv
    .split(/[;|]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const now = new Date().toISOString();
  return STANDARD_DOCUMENTS.map((d) => {
    const isMissing = flagged.some((f) => d.label.toLowerCase().includes(f) || d.key.includes(f.replace(/\s+/g, "_")));
    const status: DocStatus = isMissing ? "Missing" : "Received";
    return { key: d.key, label: d.label, required: d.required, status, history: [{ status, at: now, by: "system" }] };
  });
}

export function anonymize(caseId: string): string {
  const tail = caseId.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase() || "0000";
  return `Household #${tail}`;
}

// Convert validated import rows into case records for a resolved county.
export function rowsToCases(rows: ImportRow[], counties: County[], now: Date = new Date()): SnapCase[] {
  const iso = now.toISOString();
  const fallbackCounty = counties[0]?.id ?? "";
  return rows
    .filter((r) => r.errors.length === 0)
    .map((r) => {
      const raw = r.raw;
      const county = counties.find((c) => c.name.toLowerCase() === (raw["county"] || "").toLowerCase());
      const expedited = /^(y|yes|true|1|expedited)$/i.test(raw["expedited"] || "");
      const flags = (raw["vulnerability_flags"] || "")
        .split(/[;|]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const rawStatus = (raw["status"] || "New") as CaseStatus;
      const status: CaseStatus = expedited && rawStatus === "New" ? "Expedited Review" : rawStatus;
      const name = raw["applicant_name"] || "";
      const c: SnapCase = {
        id: raw["case_id"],
        applicantLabel: anonymize(raw["case_id"]),
        applicantName: name || undefined,
        countyId: county ? county.id : fallbackCounty,
        applicationDate: new Date(raw["application_date"]).toISOString(),
        status,
        expedited,
        householdSize: Number(raw["household_size"]) || 1,
        monthlyIncome: Number(raw["monthly_income"]) || 0,
        monthlyExpenses: Number(raw["monthly_expenses"]) || 0,
        vulnerabilityFlags: flags,
        documents: makeDocuments(raw["missing_documents"] || ""),
        notes: [],
        createdAt: iso,
        updatedAt: iso,
      };
      return c;
    });
}

export const SAMPLE_CSV = `case_id,applicant_name,county,application_date,household_size,monthly_income,monthly_expenses,expedited,status,assigned_worker,vulnerability_flags,missing_documents
SNAP-1001,Sample Applicant A,Wake County,2026-06-20,3,1450,1200,yes,Expedited Review,,Child under 6,Proof of income; Pay stubs
SNAP-1002,Sample Applicant B,Durham County,2026-06-10,1,980,700,no,Pending Review,,Elderly,
SNAP-1003,Sample Applicant C,Mecklenburg County,2026-05-28,5,3100,2400,no,Missing Documents,,,ID verification; Household verification
SNAP-1004,Sample Applicant D,Guilford County,2026-06-25,2,1600,1100,no,New,,,`;

export function downloadText(filename: string, text: string, type = "text/csv") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
