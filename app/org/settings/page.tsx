import { Disclaimer } from "@/components/Disclaimer";

export default function OrgSettingsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Agency settings</h1>
        <p className="text-sm text-gray-600">Organization profile, members, and access control.</p>
      </header>
      <Disclaimer variant="compact" />
      <div className="card card-pad">
        <h2 className="font-semibold">Organization</h2>
        <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="label">Name</label>
            <input className="input" defaultValue="Cumberland County DSS (sandbox)" />
          </div>
          <div>
            <label className="label">State</label>
            <input className="input" defaultValue="NC" />
          </div>
        </div>
      </div>
      <div className="card card-pad">
        <h2 className="font-semibold">Members and roles</h2>
        <p className="mt-2 text-sm text-gray-700">During pilot, 3–5 staff users are enabled. Roles: county_worker, supervisor, admin. Members only see clients tied to this organization.</p>
        <ul className="mt-3 divide-y divide-gray-100 text-sm">
          <li className="py-2 flex justify-between"><span>worker1@example.gov</span><span className="badge-blue">county_worker</span></li>
          <li className="py-2 flex justify-between"><span>worker2@example.gov</span><span className="badge-blue">county_worker</span></li>
          <li className="py-2 flex justify-between"><span>supervisor@example.gov</span><span className="badge-amber">supervisor</span></li>
        </ul>
      </div>
    </div>
  );
}
