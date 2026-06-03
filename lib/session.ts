// Pure session primitives — no next/headers, no Supabase imports.
// Safe to import from edge middleware and from server code alike.

export const SESSION_COOKIE = "snap_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export type Role = "applicant" | "agency";

export interface Session {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Raw profiles.user_type (e.g. 'admin'); absent for the demo session. */
  userType?: string;
}

export function encodeSession(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export function decodeSession(value: string | undefined | null): Session | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString());
    if (parsed && typeof parsed.email === "string" && (parsed.role === "applicant" || parsed.role === "agency")) {
      return {
        id: typeof parsed.id === "string" ? parsed.id : "",
        email: parsed.email,
        name: typeof parsed.name === "string" ? parsed.name : "",
        role: parsed.role,
        userType: typeof parsed.userType === "string" ? parsed.userType : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Turn an email local-part into a friendly display name. */
export function nameFromEmail(email: string, role: Role): string {
  const local = email.split("@")[0]?.trim();
  if (!local) return role === "agency" ? "Agency User" : "Applicant";
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// The Supabase `profiles.user_type` enum (existing schema) is richer than the
// two-surface routing the app needs. Map between them here.
export type UserType = "applicant" | "recipient" | "navigator" | "county" | "state" | "admin";

const AGENCY_USER_TYPES: ReadonlySet<string> = new Set(["county", "state", "admin"]);

export function roleFromUserType(userType: string | null | undefined): Role {
  return userType && AGENCY_USER_TYPES.has(userType) ? "agency" : "applicant";
}

export function userTypeFromRole(role: Role): UserType {
  return role === "agency" ? "county" : "applicant";
}
