"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Disclaimer } from "@/components/Disclaimer";
import { loginAction, type FormState } from "../actions";

const initial: FormState = {};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const [state, formAction] = useFormState(loginAction, initial);
  const params = useSearchParams();
  const confirm = params.get("confirm") === "1";
  const next = params.get("next") || "";
  return (
    <div className="max-w-md mx-auto card card-pad">
      <h1 className="text-2xl font-bold">Log in</h1>
      <p className="mt-1 text-sm text-gray-600">Welcome back. Sign in to continue your SNAP preparation.</p>
      <Disclaimer variant="compact" className="mt-4" />
      {confirm && (
        <div className="mt-4 rounded border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
          Account created. Please check your email to confirm, then log in.
        </div>
      )}
      <form className="mt-6 space-y-4" action={formAction}>
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="input"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="input"
            placeholder="••••••••"
            required
          />
        </div>
        {state.error && (
          <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {state.error}
          </div>
        )}
        <SubmitButton />
      </form>
      <div className="mt-4 text-sm text-gray-600">
        Don't have an account?{" "}
        <Link href="/signup" className="text-brand-700 font-medium">
          Create one
        </Link>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Signing in…" : "Log in"}
    </button>
  );
}
