"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  encodeSession,
  nameFromEmail,
  userTypeFromRole,
  type Role,
} from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function roleFrom(formData: FormData): Role {
  return String(formData.get("role") ?? "applicant") === "agency" ? "agency" : "applicant";
}

function nextParam(next: string): string {
  return next ? `&next=${encodeURIComponent(next)}` : "";
}

function setDemoSession(store: Awaited<ReturnType<typeof cookies>>, email: string, role: Role) {
  store.set(SESSION_COOKIE, encodeSession({ email, name: nameFromEmail(email, role), role }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();
  const role = roleFrom(formData);

  if (!email || !email.includes("@")) {
    redirect(`/login?error=email${nextParam(next)}`);
  }

  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      redirect(`/login?error=auth${nextParam(next)}`);
    }
    redirect(next.startsWith("/app") ? next : "/app");
  }

  // Demo fallback — no password check.
  const store = await cookies();
  setDemoSession(store, email, role);
  redirect(next.startsWith("/app") ? next : role === "agency" ? "/app/agency" : "/app/applicant");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = roleFrom(formData);

  if (!email || !email.includes("@")) {
    redirect("/signup?error=email");
  }
  if (password.length < 6) {
    redirect("/signup?error=password");
  }

  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || nameFromEmail(email, role),
          user_type: userTypeFromRole(role),
        },
      },
    });
    if (error) {
      redirect("/signup?error=auth");
    }
    // If email confirmation is disabled, a session is returned and the user is
    // signed in. Otherwise they must confirm via email before signing in.
    if (data.session) {
      redirect("/app");
    }
    redirect("/login?info=confirm");
  }

  // Demo fallback — treat signup as immediate sign-in.
  const store = await cookies();
  setDemoSession(store, email, role);
  redirect(role === "agency" ? "/app/agency" : "/app/applicant");
}

export async function logout() {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } else {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
  }
  redirect("/");
}
