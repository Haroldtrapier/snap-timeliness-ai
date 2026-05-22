"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitNoticeAction } from "./actions";

const initial: { error?: string } = {};

export function NoticeForm() {
  const [state, action] = useFormState(submitNoticeAction, initial);
  return (
    <form action={action} className="card card-pad space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="title">
            Notice title (optional)
          </label>
          <input id="title" name="title" className="input" placeholder="e.g. Interview Scheduled" />
        </div>
        <div>
          <label className="label" htmlFor="agency">
            Agency (optional)
          </label>
          <input id="agency" name="agency" className="input" placeholder="e.g. Cumberland County DSS" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="raw_text">
          Paste notice text
        </label>
        <textarea
          id="raw_text"
          name="raw_text"
          className="input"
          rows={8}
          placeholder="Paste the full text of your SNAP notice here..."
          required
          minLength={10}
        />
      </div>
      {state?.error && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {state.error}
        </div>
      )}
      <div className="flex justify-end items-center">
        <SubmitBtn />
      </div>
    </form>
  );
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary" type="submit" disabled={pending}>
      {pending ? "Explaining…" : "Explain notice"}
    </button>
  );
}
