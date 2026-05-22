"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Disclaimer } from "@/components/Disclaimer";
import { onboardingAction, type FormState } from "../actions";

const states = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
  ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"], ["DC", "District of Columbia"],
];

const initial: FormState = {};

export default function OnboardingPage() {
  const [state, formAction] = useFormState(onboardingAction, initial);
  return (
    <div className="max-w-2xl mx-auto card card-pad">
      <h1 className="text-2xl font-bold">Tell us about your situation</h1>
      <p className="mt-1 text-sm text-gray-600">
        We'll tailor your checklist, deadlines, and notice explanations to your household. You can change all of this later.
      </p>
      <Disclaimer variant="eligibility" className="mt-4" />

      <form className="mt-6 space-y-5" action={formAction}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="state">State</label>
            <select id="state" name="state" className="input" defaultValue="NC" required>
              {states.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="county">County</label>
            <input id="county" name="county" className="input" defaultValue="Cumberland" required />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="user_type">I am a</label>
          <select id="user_type" name="user_type" className="input" defaultValue="applicant">
            <option value="applicant">Applicant (new to SNAP)</option>
            <option value="recipient">Current SNAP recipient</option>
            <option value="navigator">Benefits navigator or nonprofit staff</option>
            <option value="county">County DSS staff</option>
            <option value="state">State SNAP agency staff</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="snap_stage">Where are you in the SNAP process?</label>
          <select id="snap_stage" name="snap_stage" className="input" defaultValue="applying">
            <option value="exploring">Exploring whether to apply</option>
            <option value="applying">Currently applying</option>
            <option value="pending">Application is pending review</option>
            <option value="approved">Approved and currently receiving SNAP</option>
            <option value="recertifying">Recertifying my benefits</option>
            <option value="denied">My application was denied</option>
            <option value="reporting_change">I need to report a change</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="household_size">Household size</label>
            <input
              id="household_size"
              name="household_size"
              type="number"
              min={1}
              max={20}
              defaultValue={3}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="income_estimate">Monthly household income (USD)</label>
            <input
              id="income_estimate"
              name="income_estimate"
              type="number"
              min={0}
              defaultValue={1800}
              className="input"
              required
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="expense_context">Expenses you have (helps tailor your checklist)</label>
          <textarea
            id="expense_context"
            name="expense_context"
            className="input"
            rows={2}
            placeholder="Rent, utilities, childcare, medical (if 60+ or disabled), etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="language_preference">Preferred language</label>
            <select id="language_preference" name="language_preference" className="input" defaultValue="en">
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="accessibility_preference">Accessibility needs</label>
            <select id="accessibility_preference" name="accessibility_preference" className="input" defaultValue="none">
              <option value="none">None</option>
              <option value="screen_reader">Screen reader</option>
              <option value="large_text">Large text</option>
              <option value="high_contrast">High contrast</option>
            </select>
          </div>
        </div>

        {state.error && (
          <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {state.error}
          </div>
        )}

        <Submit />
      </form>
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Saving…" : "Build my checklist"}
    </button>
  );
}
