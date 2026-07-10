import type { CaseStatus, DocStatus, SnapCase } from "@/lib/backlog/types";

// Serializable mutation set shared by the client store, the API bridge, and the
// server repository. Each maps 1:1 to a store action so the UI behaves the same
// whether it is backed by localStorage (demo) or Postgres (Supabase configured).
export type BacklogAction =
  | { kind: "import"; cases: SnapCase[] }
  | { kind: "assignWorker"; caseExternalId: string; workerId: string }
  | { kind: "setStatus"; caseExternalId: string; status: CaseStatus }
  | { kind: "setDocStatus"; caseExternalId: string; docKey: string; status: DocStatus; by: string }
  | { kind: "addNote"; caseExternalId: string; text: string; author: string }
  | { kind: "closeCase"; caseExternalId: string }
  | { kind: "audit"; action: string; caseExternalId: string; countyId?: string; prev?: string; next?: string; systemNote?: string; automated?: boolean };
