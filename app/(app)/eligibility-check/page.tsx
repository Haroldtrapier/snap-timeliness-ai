"use client";
import { useState } from "react";
import { Disclaimer } from "@/components/Disclaimer";

type Result = {
  preliminary: "likely" | "possibly" | "unlikely";
  notes: string[];
};

function prescreen(input: {
  state: string;
  householdSize: number;
  monthlyIncome: number;
  elderlyOrDisabled: boolean;
  student: boolean;
  rent: number;
  utilities: number;
  childcare: number;
  medical: number;
}): Result {
  // Federal 130% FPL gross income, monthly, FY2026-era approximation.
  // Real eligibility depends on the state and is determined by the agency.
  const grossLimits130: Record<number, number> = {
    1: 1632, 2: 2215, 3: 2798, 4: 3380, 5: 3963, 6: 4546, 7: 5129, 8: 5712,
  };
  const limit = grossLimits130[Math.min(8, Math.max(1, input.householdSize))] || grossLimits130[8];
  const notes: string[] = [];
  notes.push(`Gross income limit reference for household size ${input.householdSize}: ~$${limit}/mo (130% FPL).`);
  if (input.elderlyOrDisabled) notes.push("Elderly/disabled households use net income test and may deduct uncapped medical expenses over $35.");
  if (input.student) notes.push("Student status (18–49, half-time+) may restrict eligibility unless an exemption applies. Confirm with a caseworker.");
  if (input.rent + input.utilities > 500) notes.push("Shelter costs may produce an excess shelter deduction that helps net income.");
  if (input.childcare > 0) notes.push("Dependent care expenses may be deductible.");
  if (input.medical > 35 && input.elderlyOrDisabled) notes.push("Medical expenses over $35 may be deductible for elderly/disabled households.");

  let preliminary: Result["preliminary"];
  if (input.monthlyIncome <= limit * 0.9) preliminary = "likely";
  else if (input.monthlyIncome <= limit * 1.05) preliminary = "possibly";
  else preliminary = "unlikely";

  if (input.elderlyOrDisabled) {
    // For elderly/disabled, only net test applies — bias to "possibly" if income near limit.
    if (preliminary === "unlikely") preliminary = "possibly";
  }
  return { preliminary, notes };
}

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

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Eligibility check</h1>
        <p className="text-sm text-gray-600">A preliminary picture only. We do not determine eligibility.</p>
      </header>
      <Disclaimer variant="eligibility" />

      <form
        className="card card-pad grid md:grid-cols-2 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setResult(prescreen(form));
        }}
      >
        <div>
          <label className="label">State</label>
          <select className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
            <option value="NC">North Carolina</option>
            <option value="SC">South Carolina</option>
            <option value="VA">Virginia</option>
            <option value="other">Other</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">State-specific rules vary. We use federal references until state config is loaded.</p>
        </div>
        <div>
          <label className="label">Household size</label>
          <input type="number" min={1} max={20} className="input"
            value={form.householdSize}
            onChange={(e) => setForm({ ...form, householdSize: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">Monthly household income (USD)</label>
          <input type="number" min={0} className="input"
            value={form.monthlyIncome}
            onChange={(e) => setForm({ ...form, monthlyIncome: Number(e.target.value) })} />
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.elderlyOrDisabled}
              onChange={(e) => setForm({ ...form, elderlyOrDisabled: e.target.checked })} />
            Elderly (60+) or disabled in household
          </label>
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.student}
              onChange={(e) => setForm({ ...form, student: e.target.checked })} />
            Student (18–49, half-time+)
          </label>
        </div>
        <div>
          <label className="label">Rent or mortgage (USD/mo)</label>
          <input type="number" min={0} className="input" value={form.rent}
            onChange={(e) => setForm({ ...form, rent: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">Utilities (USD/mo)</label>
          <input type="number" min={0} className="input" value={form.utilities}
            onChange={(e) => setForm({ ...form, utilities: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">Childcare (USD/mo)</label>
          <input type="number" min={0} className="input" value={form.childcare}
            onChange={(e) => setForm({ ...form, childcare: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">Medical expenses, if 60+ or disabled (USD/mo)</label>
          <input type="number" min={0} className="input" value={form.medical}
            onChange={(e) => setForm({ ...form, medical: Number(e.target.value) })} />
        </div>

        <div className="md:col-span-2">
          <button className="btn-primary" type="submit">See preliminary picture</button>
        </div>
      </form>

      {result && (
        <div className="card card-pad">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Preliminary picture:</h2>
            <span className={
              result.preliminary === "likely" ? "badge-green"
              : result.preliminary === "possibly" ? "badge-amber"
              : "badge-gray"
            }>
              {result.preliminary === "likely" ? "Likely worth applying"
                : result.preliminary === "possibly" ? "Possibly eligible — confirm with agency"
                : "Above usual gross income range — confirm with agency"}
            </span>
          </div>
          <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
            {result.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
          <div className="mt-4 text-sm">
            <span className="font-semibold">Suggested next step: </span>
            {result.preliminary === "unlikely"
              ? "Call your county DSS to confirm — deductions like shelter and medical can change the picture."
              : "Open your checklist and start gathering documents."}
          </div>
          <Disclaimer variant="eligibility" className="mt-3" />
        </div>
      )}
    </div>
  );
}
