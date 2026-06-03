"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  encodeSession,
  nameFromEmail,
  type Role,
} from "@/lib/auth";

// Demo sign-in: accepts any email (no password), sets a session cookie,
// and routes to the surface for the chosen role. Replace with a real
// identity provider — see lib/auth.ts.
export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const roleInput = String(formData.get("role") ?? "applicant");
  const role: Role = roleInput === "agency" ? "agency" : "applicant";
  const next = String(formData.get("next") ?? "").trim();

  if (!email || !email.includes("@")) {
    redirect(`/login?error=email${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession({ email, name: nameFromEmail(email, role), role }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  const fallback = role === "agency" ? "/app/agency" : "/app/applicant";
  redirect(next && next.startsWith("/app") ? next : fallback);
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/");
}
