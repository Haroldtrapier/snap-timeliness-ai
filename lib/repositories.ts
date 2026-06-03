import {
  APPLICANT_DATA,
  AGENCY_DATA,
  type ApplicantProfile,
  type AgencyMetric,
  type AgencyClient,
} from "@/lib/data";

// ------------------------------------------------------------------
// Data-access layer (repositories).
//
// The authenticated routes call these async functions instead of
// importing the mock objects directly. Today they resolve the
// in-memory fixtures from lib/data.ts; each is an integration point
// for a real, per-user, auth-scoped data source (Postgres/Supabase,
// the state system of record, a notice-parsing service, etc.).
//
// Keeping the call sites async + typed means swapping in a real
// backend is a change here only, not in the components.
// ------------------------------------------------------------------

export interface AgencyCaseload {
  metrics: AgencyMetric[];
  clients: AgencyClient[];
}

/** The signed-in applicant's case. Integration point: look up by userId. */
export async function getApplicantCase(_userId?: string): Promise<ApplicantProfile> {
  return APPLICANT_DATA.applicant;
}

/** The caseworker's caseload + agency metrics. Integration point: scope by agency/worker. */
export async function getAgencyCaseload(_workerId?: string): Promise<AgencyCaseload> {
  return AGENCY_DATA;
}
