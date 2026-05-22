"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Disclaimer } from "@/components/Disclaimer";
import { signupAction, type FormState } from "../actions";

const initial: FormState = {};

export default function SignupPage() {
  const [state, formAction] = useFormState(signupAction, initial);
  return (
    <div className="max-w-md mx-auto card card-pad">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-gray-600">Free for applicants and recipients. No fees, ever.</p>
      <Disclaimer variant="compact" className="mt-4" />
      <form className="mt-6 space-y-4" action={formAction}>
        <div>
          <label className="label" htmlFor="full_name">Full name</label>
          <input id="full_name" name="full_name" className="input" required maxLength={120} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="input"
            required
            minLength={8}
          />
          <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
        </div>
        {state.error && (
          <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {state.error}
          </div>
        )}
        <SubmitButton />
      </form>
      <div className="mt-4 text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-700 font-medium">
          Log in
        </Link>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Creating account…" : "Continue"}
    </button>
  );
}
