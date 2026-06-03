import { cookies } from "next/headers";

// ------------------------------------------------------------------
// Demo session layer.
//
// This is a lightweight, cookie-based session intended to make the
// authenticated product surfaces real and navigable WITHOUT a backend.
// It is NOT production auth — there is no password check, no identity
// provider, and the cookie is not signed.
//
// Integration point: replace encode/decode + getSession with a real
// identity provider (e.g. Supabase Auth, Auth.js, SAML/SSO for agency
// staff). The route guards in middleware.ts and the (app) layout call
// only getSession()/the cookie name, so swapping the implementation
// here is enough.
// ------------------------------------------------------------------

export const SESSION_COOKIE = "snap_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export type Role = "applicant" | "agency";

export interface Session {
  email: string;
  name: string;
  role: Role;
}

export function encodeSession(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export function decodeSession(value: string | undefined | null): Session | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString());
    if (parsed && typeof parsed.email === "string" && (parsed.role === "applicant" || parsed.role === "agency")) {
      return parsed as Session;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}

/** Turn an email local-part into a friendly display name. */
export function nameFromEmail(email: string, role: Role): string {
  const local = email.split("@")[0]?.trim();
  if (!local) return role === "agency" ? "Agency User" : "Applicant";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
