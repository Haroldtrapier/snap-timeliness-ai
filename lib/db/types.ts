/**
 * Database row types. These mirror the columns defined in
 * supabase/migrations/20260522000000_initial_schema.sql.
 *
 * Hand-written rather than generated so the project keeps working when run
 * offline. To regenerate from a live Supabase project:
 *   supabase gen types typescript --project-id <id> > lib/db/types.gen.ts
 */

export type UserType = "applicant" | "recipient" | "navigator" | "county" | "state" | "admin";
export type OrgRole = "member" | "worker" | "supervisor" | "admin";
export type SnapStage =
  | "exploring"
  | "applying"
  | "pending"
  | "approved"
  | "recertifying"
  | "denied"
  | "reporting_change";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  user_type: UserType;
  state: string | null;
  county: string | null;
  language: string | null;
  accessibility: unknown;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  owner_user_id: string | null;
  organization_id: string | null;
  full_name: string;
  state: string | null;
  county: string | null;
  language: string | null;
  created_at: string;
  updated_at: string;
};

export type SnapCase = {
  id: string;
  client_id: string;
  stage: SnapStage;
  household_size: number | null;
  monthly_income_cents: number | null;
  expedited: boolean | null;
  filed_at: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HouseholdMember = {
  id: string;
  client_id: string;
  full_name: string | null;
  relationship: string | null;
  date_of_birth: string | null;
  is_minor: boolean | null;
  is_elderly: boolean | null;
  is_disabled: boolean | null;
  is_student: boolean | null;
  created_at: string;
};

export type EligibilityPrescreen = {
  id: string;
  client_id: string;
  household_size: number;
  monthly_income_cents: number;
  elderly_or_disabled: boolean | null;
  student: boolean | null;
  rent_cents: number | null;
  utilities_cents: number | null;
  childcare_cents: number | null;
  medical_cents: number | null;
  preliminary: string;
  notes: unknown;
  created_at: string;
};

export type ApplicationChecklist = {
  id: string;
  case_id: string;
  generated_at: string;
};

export type ChecklistItem = {
  id: string;
  checklist_id: string;
  label: string;
  category: string;
  required: boolean;
  status: "open" | "uploaded" | "complete";
  notes: string | null;
};

export type DocumentRow = {
  id: string;
  client_id: string;
  case_id: string | null;
  checklist_item_id: string | null;
  storage_path: string;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  detected_type: string | null;
  status: "uploaded" | "review" | "flagged" | "accepted" | "rejected";
  uploaded_by: string | null;
  uploaded_at: string;
};

export type Notice = {
  id: string;
  client_id: string;
  case_id: string | null;
  title: string;
  agency: string | null;
  notice_type: string | null;
  urgency: string | null;
  received_at: string | null;
  raw_text: string | null;
  storage_path: string | null;
  created_at: string;
};

export type NoticeExplanation = {
  id: string;
  notice_id: string;
  summary: string | null;
  action: string | null;
  deadline: string | null;
  urgency: string | null;
  questions: unknown;
  model: string | null;
  created_at: string;
};

export type Deadline = {
  id: string;
  client_id: string;
  case_id: string | null;
  type: string;
  due_at: string;
  description: string | null;
  related_notice_id: string | null;
  related_document_id: string | null;
  suggested_next: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: unknown;
  ip_address: string | null;
  created_at: string;
};

export type AIConversation = {
  id: string;
  user_id: string;
  client_id: string | null;
  surface: string;
  messages: unknown;
  model: string | null;
  created_at: string;
};
