import { mockProfile } from "@/lib/mock-data";
import { Disclaimer } from "@/components/Disclaimer";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-600">Your profile, language, accessibility, and notification preferences.</p>
      </header>
      <Disclaimer variant="compact" />

      <form className="card card-pad grid md:grid-cols-2 gap-3">
        <div>
          <label className="label">Name</label>
          <input className="input" defaultValue={mockProfile.name} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" defaultValue={mockProfile.email} />
        </div>
        <div>
          <label className="label">State</label>
          <input className="input" defaultValue={mockProfile.state} />
        </div>
        <div>
          <label className="label">County</label>
          <input className="input" defaultValue={mockProfile.county} />
        </div>
        <div>
          <label className="label">Household size</label>
          <input className="input" type="number" defaultValue={mockProfile.householdSize} />
        </div>
        <div>
          <label className="label">Language</label>
          <select className="input" defaultValue={mockProfile.language}>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <button type="button" className="btn-primary" disabled>Save (pilot)</button>
        </div>
      </form>

      <div className="card card-pad">
        <h2 className="font-semibold">Privacy</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Your documents are private. Only you and your assigned caseworker can access them.</li>
          <li>AI requests are processed on our server. The AI provider does not see your account login.</li>
          <li>You can export or delete your data at any time during pilot.</li>
        </ul>
      </div>
    </div>
  );
}
