import type { Metadata } from "next";
import Link from "next/link";
import { login } from "./actions";
import { Icon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Sign in · SNAP AI",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link className="brand" href="/" aria-label="SNAP AI home">
          <div className="brand-mark" aria-hidden="true" />
          <div>
            <div>SNAP AI</div>
            <span className="brand-sub">Sign in to your workspace</span>
          </div>
        </Link>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">
          Choose who you are and sign in. Applicants and recipients always have free access.
        </p>

        {error && (
          <div className="auth-error" role="alert">
            Please enter a valid email address.
          </div>
        )}

        <form className="auth-form" action={login}>
          {next && <input type="hidden" name="next" value={next} />}

          <fieldset className="auth-roles">
            <legend className="sr-only">I am signing in as</legend>
            <label className="auth-role">
              <input type="radio" name="role" value="applicant" defaultChecked />
              <span className="auth-role-body">
                <Icon.Heart />
                <b>Applicant / Recipient</b>
                <small>Track your case, documents, and deadlines</small>
              </span>
            </label>
            <label className="auth-role">
              <input type="radio" name="role" value="agency" />
              <span className="auth-role-body">
                <Icon.Building />
                <b>Agency / Caseworker</b>
                <small>Caseload, timeliness, and review queue</small>
              </span>
            </label>
          </fieldset>

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.org"
              required
            />
          </label>

          <button type="submit" className="btn btn-primary btn-lg auth-submit">
            <Icon.Arrow /> Continue
          </button>
        </form>

        <p className="auth-demo" role="note">
          <b>Demo sign-in.</b> No password required — this is a prototype session, not real
          authentication. Final eligibility decisions are always made by your state SNAP agency.
        </p>
      </div>
    </div>
  );
}
