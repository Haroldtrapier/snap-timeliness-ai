import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

type AuditAction =
  | "signup"
  | "onboarding_complete"
  | "document_upload"
  | "notice_explanation"
  | "eligibility_prescreen"
  | "deadline_create"
  | "deadline_update"
  | "deadline_delete"
  | "assistant_query"
  | "logout"
  | "profile_update";

/**
 * Log a sensitive user action. Writes go through the service-role client so
 * users can't tamper with their own audit trail. Failures here are swallowed
 * so audit problems never block the user's primary action.
 */
export async function logAudit(args: {
  actorUserId: string | null;
  actorRole?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const ip = getClientIp();
    await admin.from("audit_logs").insert({
      actor_user_id: args.actorUserId,
      actor_role: args.actorRole ?? null,
      action: args.action,
      entity_type: args.entityType,
      entity_id: args.entityId ?? null,
      metadata: args.metadata ?? null,
      ip_address: ip,
    });
  } catch (e) {
    // Audit must not break the primary flow. Surface to logs only.
    console.error("[audit] failed to write log:", (e as Error)?.message);
  }
}

function getClientIp(): string | null {
  try {
    const h = headers();
    const fwd = h.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]!.trim();
    return h.get("x-real-ip");
  } catch {
    return null;
  }
}
