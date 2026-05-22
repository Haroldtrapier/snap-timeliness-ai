import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto card card-pad">
      <h1 className="text-2xl font-bold">Log in</h1>
      <p className="mt-1 text-sm text-gray-600">Welcome back. Sign in to continue your SNAP preparation.</p>
      <Disclaimer variant="compact" className="mt-4" />
      <form className="mt-6 space-y-4" action="/dashboard">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" placeholder="you@example.com" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" placeholder="••••••••" required />
        </div>
        <button type="submit" className="btn-primary w-full">Log in</button>
      </form>
      <div className="mt-4 text-sm text-gray-600">
        Don't have an account? <Link href="/signup" className="text-brand-700 font-medium">Create one</Link>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Demo mode: authentication is mocked until Supabase Auth is configured.
      </p>
    </div>
  );
}
