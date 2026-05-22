"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { upsertProfile } from "@/lib/db/profiles";
import { getOrCreateOwnedClient, getOrCreateActiveCase } from "@/lib/db/cases";
import { getOrCreateChecklist } from "@/lib/db/checklist";
import { logAudit } from "@/lib/db/audit";
import type { SnapStage, UserType } from "@/lib/db/types";

export type FormState = { error?: string; ok?: boolean };

const SignupSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password required"),
});

const OnboardingSchema = z.object({
  state: z.string().min(1).max(80),
  county: z.string().min(1).max(120),
  user_type: z.enum(["applicant", "recipient", "navigator", "county", "state"]),
  snap_stage: z.enum([
    "exploring",
    "applying",
    "pending",
    "approved",
    "recertifying",
    "denied",
    "reporting_change",
  ]),
  household_size: z.coerce.number().int().min(1).max(20),
  income_estimate: z.coerce.number().int().min(0).max(1_000_000),
  expense_context: z.string().max(2000).optional().nullable(),
  language_preference: z.string().min(2).max(8).default("en"),
  accessibility_preference: z.string().max(60).default("none"),
});

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." };
  }
  const parsed = SignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo:
        (process.env.NEXT_PUBLIC_APP_URL ?? "") + "/dashboard",
    },
  });

  if (error) return { error: error.message };
  const user = data.user;
  if (!user) {
    return { error: "Signup created no user. Check Supabase Auth email confirmation settings." };
  }

  try {
    await upsertProfile(user.id, {
      email: parsed.data.email,
      full_name: parsed.data.full_name,
      user_type: "applicant",
    });
    await logAudit({
      actorUserId: user.id,
      actorRole: "applicant",
      action: "signup",
      entityType: "profile",
      entityId: user.id,
      metadata: { email: parsed.data.email },
    });
  } catch (e) {
    return { error: `Account created, but profile setup failed: ${(e as Error).message}` };
  }

  // If email confirmation is disabled, the user has a session and can proceed.
  // Otherwise they'll need to confirm before middleware lets them past /login.
  if (data.session) {
    redirect("/onboarding");
  }
  redirect("/login?confirm=1");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." };
  }
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: error.message };
  if (!data.user) return { error: "Login failed." };

  // After login, push the user to onboarding if their profile has no state set.
  const { data: profile } = await supabase
    .from("profiles")
    .select("state")
    .eq("id", data.user.id)
    .maybeSingle();
  const next = (formData.get("next") as string | null) || null;
  if (next && next.startsWith("/")) {
    redirect(next);
  }
  if (!profile?.state) {
    redirect("/onboarding");
  }
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.auth.signOut();
  if (user) {
    await logAudit({
      actorUserId: user.id,
      action: "logout",
      entityType: "session",
      entityId: user.id,
    });
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function onboardingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase is not configured." };
  }
  const raw = Object.fromEntries(formData);
  const parsed = OnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    "Applicant";

  try {
    // 1) Update profile with state/county/user_type/language/accessibility.
    await upsertProfile(user.id, {
      email: user.email ?? null,
      full_name: fullName,
      user_type: parsed.data.user_type as UserType,
      state: parsed.data.state,
      county: parsed.data.county,
      language: parsed.data.language_preference,
      accessibility:
        parsed.data.accessibility_preference === "none"
          ? []
          : [parsed.data.accessibility_preference],
    });

    // 2) Get or create the owned client record for this applicant.
    const client = await getOrCreateOwnedClient({
      fullName,
      state: parsed.data.state,
      county: parsed.data.county,
      language: parsed.data.language_preference,
    });

    // 3) Get or create the active SNAP case.
    const snapCase = await getOrCreateActiveCase({
      clientId: client.id,
      stage: parsed.data.snap_stage as SnapStage,
      householdSize: parsed.data.household_size,
      monthlyIncomeCents: parsed.data.income_estimate * 100,
    });

    // 4) Get or create the application checklist.
    await getOrCreateChecklist(snapCase.id);

    // 5) Capture the (free-text) expense context as a case note for the
    //    caseworker, not as a parsed eligibility input.
    if (parsed.data.expense_context && parsed.data.expense_context.trim()) {
      await supabase.from("case_notes").insert({
        client_id: client.id,
        author_user_id: user.id,
        body: `Onboarding expense context: ${parsed.data.expense_context.trim()}`,
        visibility: "internal",
      });
    }

    await logAudit({
      actorUserId: user.id,
      actorRole: parsed.data.user_type,
      action: "onboarding_complete",
      entityType: "snap_case",
      entityId: snapCase.id,
      metadata: {
        state: parsed.data.state,
        county: parsed.data.county,
        stage: parsed.data.snap_stage,
        household_size: parsed.data.household_size,
      },
    });
  } catch (e) {
    return { error: `Onboarding failed: ${(e as Error).message}` };
  }

  redirect("/dashboard");
}
