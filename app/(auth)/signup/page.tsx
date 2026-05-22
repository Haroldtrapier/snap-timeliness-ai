import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto card card-pad">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-gray-600">Free for applicants and recipients. No fees, ever.</p>
      <Disclaimer variant="compact" className="mt-4" />
      <form className="mt-6 space-y-4" action="/onboarding">
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" required minLength={8} />
        </div>
        <button type="submit" className="btn-primary w-full">Continue</button>
      </form>
      <div className="mt-4 text-sm text-gray-600">
        Already have an account? <Link href="/login" className="text-brand-700 font-medium">Log in</Link>
      </div>
    </div>
  );
}
