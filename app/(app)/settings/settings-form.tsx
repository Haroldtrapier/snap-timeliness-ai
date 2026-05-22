"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateProfileAction } from "./actions";
import type { Profile } from "@/lib/db/types";

const initial: { error?: string; ok?: boolean } = {};

export function SettingsForm({ profile }: { profile: Profile }) {
  const [state, action] = useFormState(updateProfileAction, initial);
  return (
    <form action={action} className="card card-pad grid md:grid-cols-2 gap-3">
      <div>
        <label className="label" htmlFor="full_name">
          Name
        </label>
        <input id="full_name" name="full_name" className="input" defaultValue={profile.full_name ?? ""} required />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" defaultValue={profile.email ?? ""} disabled />
        <p className="mt-1 text-xs text-gray-500">Change your email via your Supabase Auth provider.</p>
      </div>
      <div>
        <label className="label" htmlFor="state">
          State
        </label>
        <input id="state" name="state" className="input" defaultValue={profile.state ?? ""} />
      </div>
      <div>
        <label className="label" htmlFor="county">
          County
        </label>
        <input id="county" name="county" className="input" defaultValue={profile.county ?? ""} />
      </div>
      <div>
        <label className="label" htmlFor="language">
          Language
        </label>
        <select id="language" name="language" className="input" defaultValue={profile.language ?? "en"}>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
      <div className="md:col-span-2 flex items-center justify-between">
        {state.ok && <span className="text-sm text-green-700">Saved.</span>}
        {state.error && <span className="text-sm text-red-700">{state.error}</span>}
        <Submit />
      </div>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary ml-auto" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </button>
  );
}
