"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createDeadlineAction } from "./actions";

const initial: { error?: string; ok?: boolean } = {};

const types = [
  ["interview", "Interview"],
  ["document_due", "Document due"],
  ["recertification", "Recertification"],
  ["periodic_report", "Periodic report"],
  ["change_report", "Change report"],
  ["appeal", "Appeal window"],
];

export function DeadlineForm() {
  const [state, action] = useFormState(createDeadlineAction, initial);
  return (
    <form action={action} className="card card-pad space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="type">
            Type
          </label>
          <select id="type" name="type" className="input" defaultValue="document_due" required>
            {types.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="due_at">
            Due date
          </label>
          <input id="due_at" name="due_at" type="date" className="input" required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">
          Description
        </label>
        <input id="description" name="description" className="input" placeholder="Submit pay stubs" />
      </div>
      <div>
        <label className="label" htmlFor="suggested_next">
          Suggested next step (optional)
        </label>
        <input
          id="suggested_next"
          name="suggested_next"
          className="input"
          placeholder="Upload pay stubs in Documents."
        />
      </div>
      {state?.error && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {state.error}
        </div>
      )}
      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Saving…" : "Add deadline"}
    </button>
  );
}
