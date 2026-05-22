"use client";
import { useState } from "react";
import { Disclaimer } from "@/components/Disclaimer";

type Result = {
  preliminary: "likely" | "possibly" | "unlikely";
  notes: string[];
  persisted?: boolean;
  suggestedNext?: string;
};

export default function EligibilityCheckPage() {
  const [form, setForm] = useState({
    state: "NC",
    householdSize: 3,
    monthlyIncome: 1800,
    elderlyOrDisabled: false,
    student: false,
    rent: 900,
    utilities: 150,
    childcare: 0,
    medical: 0,
  });
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/eligibility-prescreen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setResult({
        preliminary: data.preliminary,
        notes: data.notes ?? [],
        persisted: Boolean(data.persisted),
        suggestedNext: data.suggestedNext,
      });
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Eligibility check</h1>
        <p className="text-sm text-gray-600">A preliminary picture only. We do not determine eligibility.</p>
      </header>
      <Disclaimer variant="eligibility" />

      <form className="card card-pad grid md:grid-cols-2 gap-3" onSubmit={onSubmit}>
        <div>
          <label className="label">State</label>
          <select
            className="input"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
          >
            <option value="NC">North Carolina</option>
            <option value="SC">South Carolina</option>
            <option value="VA">Virginia</option>
            <option value="other">Other</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            State-specific rules vary. We use federal references until state config is loaded.
          </p>
        </div>
        <div>
          <label className="label">Household size</label>
          <input
            type="number"
            min={1}
            max={20}
            className="input"
            value={form.householdSize}
            onChange={(e) => setForm({ ...form, householdSize: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Monthly household income (USD)</label>
          <input
            type="number"
            min={0}
            className="input"
            value={form.monthlyIncome}
            onChange={(e) => setForm({ ...form, monthlyIncome: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.elderlyOrDisabled}
              onChange={(e) => setForm({ ...form, elderlyOrDisabled: e.target.checked })}
            />
            Elderly (60+) or disabled in household
          </label>
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.student}
              onChange={(e) => setForm({ ...form, student: e.target.checked })}
            />
            Student (18–49, half-time+)
          </label>
        </div>
        <div>
          <label className="label">Rent or mortgage (USD/mo)</label>
          <input
            type="number"
            min={0}
            className="input"
            value={form.rent}
            onChange={(e) => setForm({ ...form, rent: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Utilities (USD/mo)</label>
          <input
            type="number"
            min={0}
            className="input"
            value={form.utilities}
            onChange={(e) => setForm({ ...form, utilities: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Childcare (USD/mo)</label>
          <input
            type="number"
            min={0}
            className="input"
            value={form.childcare}
            onChange={(e) => setForm({ ...form, childcare: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Medical expenses, if 60+ or disabled (USD/mo)</label>
          <input
            type="number"
            min={0}
            className="input"
            value={form.medical}
            onChange={(e) => setForm({ ...form, medical: Number(e.target.value) })}
          />
        </div>

        <div className="md:col-span-2">
          {error && (
            <div role="alert" className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? "Checking…" : "See preliminary picture"}
          </button>
        </div>
      </form>

      {result && (
        <div className="card card-pad">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Preliminary picture:</h2>
            <span
              className={
                result.preliminary === "likely"
                  ? "badge-green"
                  : result.preliminary === "possibly"
                  ? "badge-amber"
                  : "badge-gray"
              }
            >
              {result.preliminary === "likely"
                ? "Likely worth applying"
                : result.preliminary === "possibly"
                ? "Possibly eligible — confirm with agency"
                : "Above usual gross income range — confirm with agency"}
            </span>
          </div>
          <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
            {result.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          {result.suggestedNext && (
            <div className="mt-4 text-sm">
              <span className="font-semibold">Suggested next step: </span>
              {result.suggestedNext}
            </div>
          )}
          {result.persisted && (
            <p className="mt-2 text-xs text-gray-500">
              Saved to your case. View past pre-screens in your case history.
            </p>
          )}
          <Disclaimer variant="eligibility" className="mt-3" />
        </div>
      )}
    </div>
  );
}
