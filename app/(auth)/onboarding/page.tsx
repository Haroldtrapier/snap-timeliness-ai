import { Disclaimer } from "@/components/Disclaimer";

const states = [
  ["NC", "North Carolina"], ["SC", "South Carolina"], ["VA", "Virginia"], ["GA", "Georgia"], ["TN", "Tennessee"],
  ["FL", "Florida"], ["TX", "Texas"], ["CA", "California"], ["NY", "New York"], ["OH", "Ohio"], ["other", "Other"],
];

export default function OnboardingPage() {
  return (
    <div className="max-w-2xl mx-auto card card-pad">
      <h1 className="text-2xl font-bold">Tell us about your situation</h1>
      <p className="mt-1 text-sm text-gray-600">
        We'll tailor your checklist, deadlines, and notice explanations to your household. You can change all of this later.
      </p>
      <Disclaimer variant="eligibility" className="mt-4" />

      <form className="mt-6 space-y-5" action="/dashboard">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="state">State</label>
            <select id="state" className="input" defaultValue="NC">
              {states.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="county">County</label>
            <input id="county" className="input" defaultValue="Cumberland" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="userType">I am a</label>
          <select id="userType" className="input">
            <option value="applicant">Applicant (new to SNAP)</option>
            <option value="recipient">Current SNAP recipient</option>
            <option value="navigator">Benefits navigator or nonprofit staff</option>
            <option value="county">County DSS staff</option>
            <option value="state">State SNAP agency staff</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="stage">Where are you in the SNAP process?</label>
          <select id="stage" className="input" defaultValue="applying">
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
            <label className="label" htmlFor="householdSize">Household size</label>
            <input id="householdSize" type="number" min={1} max={20} defaultValue={3} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="income">Monthly household income (USD)</label>
            <input id="income" type="number" min={0} defaultValue={1800} className="input" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="expenses">Expenses you have (helps tailor your checklist)</label>
          <textarea id="expenses" className="input" rows={2} placeholder="Rent, utilities, childcare, medical (if 60+ or disabled), etc." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="language">Preferred language</label>
            <select id="language" className="input" defaultValue="en">
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="accessibility">Accessibility needs</label>
            <select id="accessibility" className="input">
              <option value="none">None</option>
              <option value="screen_reader">Screen reader</option>
              <option value="large_text">Large text</option>
              <option value="high_contrast">High contrast</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full">Build my checklist</button>
      </form>
    </div>
  );
}
