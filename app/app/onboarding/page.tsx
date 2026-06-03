import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getApplicantClientId } from "@/lib/repositories";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Icon } from "@/components/Icons";
import { completeOnboarding } from "./actions";

export const metadata: Metadata = {
  title: "Set up your application · SNAP AI",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  // Nothing to set up in demo mode, or if a client already exists.
  if (!isSupabaseConfigured || session.id === "demo") redirect("/app/applicant");
  const existingClientId = await getApplicantClientId(session.id);
  if (existingClientId) redirect("/app/applicant");

  return (
    <div className="onboarding">
      <div className="section-head">
        <span className="eyebrow">
          <span className="dot" />
          Welcome, {session.name}
        </span>
        <h1 className="section-title">Set up your SNAP application</h1>
        <p className="section-sub">
          A couple of details so we can build your document checklist and track your case. This is
          preparation and guidance only — your state SNAP agency makes the final decision.
        </p>
      </div>

      <div className="card onboarding-card">
        {error && (
          <div className="auth-error" role="alert">
            {error === "name" ? "Please enter your full name." : "Something went wrong saving your details. Please try again."}
          </div>
        )}

        <form className="auth-form" action={completeOnboarding}>
          <label className="auth-field">
            <span>Full name</span>
            <input type="text" name="full_name" autoComplete="name" defaultValue={session.name} required />
          </label>

          <div className="onboarding-row">
            <label className="auth-field">
              <span>State</span>
              <input type="text" name="state" placeholder="e.g. NC" maxLength={2} />
            </label>
            <label className="auth-field">
              <span>County</span>
              <input type="text" name="county" placeholder="e.g. Cumberland" />
            </label>
          </div>

          <div className="onboarding-row">
            <label className="auth-field">
              <span>Household size</span>
              <input type="number" name="household_size" min={1} max={20} placeholder="e.g. 4" />
            </label>
            <label className="auth-field">
              <span>Monthly income (USD, optional)</span>
              <input type="number" name="monthly_income" min={0} step="1" placeholder="e.g. 2400" />
            </label>
          </div>

          <label className="auth-field">
            <span>Preferred language</span>
            <input type="text" name="language" defaultValue="en" placeholder="en" />
          </label>

          <button type="submit" className="btn btn-primary btn-lg auth-submit">
            <Icon.Sprout /> Create my application
          </button>
        </form>

        <p className="auth-demo" role="note">
          You can update these later. We never sell your data or use it to train models.
        </p>
      </div>
    </div>
  );
}
