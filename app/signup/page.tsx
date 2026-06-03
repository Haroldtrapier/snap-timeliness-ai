import type { Metadata } from "next";
import Link from "next/link";
import { signup } from "@/app/login/actions";
import { Icon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Create account · SNAP AI",
};

const ERRORS: Record<string, string> = {
  email: "Please enter a valid email address.",
  password: "Password must be at least 6 characters.",
  auth: "We couldn't create that account. It may already exist.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link className="brand" href="/" aria-label="SNAP AI home">
          <div className="brand-mark" aria-hidden="true" />
          <div>
            <div>SNAP AI</div>
            <span className="brand-sub">Create your workspace</span>
          </div>
        </Link>

        <h1 className="auth-title">Create an account</h1>
        <p className="auth-sub">
          Free for applicants and recipients. Tell us who you are to set up the right workspace.
        </p>

        {error && (
          <div className="auth-error" role="alert">
            {ERRORS[error] ?? "Something went wrong. Please try again."}
          </div>
        )}

        <form className="auth-form" action={signup}>
          <fieldset className="auth-roles">
            <legend className="sr-only">I am signing up as</legend>
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
            <span>Full name</span>
            <input type="text" name="full_name" autoComplete="name" placeholder="Your name" />
          </label>

          <label className="auth-field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" placeholder="you@example.org" required />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </label>

          <button type="submit" className="btn btn-primary btn-lg auth-submit">
            <Icon.Sprout /> Create account
          </button>
        </form>

        <p className="auth-alt">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>

        <p className="auth-demo" role="note">
          <b>Preparation &amp; guidance only.</b> Final eligibility decisions are made by your state
          SNAP agency.
        </p>
      </div>
    </div>
  );
}
