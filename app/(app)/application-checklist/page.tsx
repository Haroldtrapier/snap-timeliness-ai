import { redirect } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import { getOwnedClient, getOrCreateActiveCase } from "@/lib/db/cases";
import { getOrCreateChecklist } from "@/lib/db/checklist";
import type { ChecklistItem } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function ChecklistPage() {
  const client = await getOwnedClient();
  if (!client) redirect("/onboarding");
  const snapCase = await getOrCreateActiveCase({ clientId: client.id });
  const { items } = await getOrCreateChecklist(snapCase.id);

  const groups: Record<string, ChecklistItem[]> = {};
  for (const item of items) {
    (groups[item.category] ||= []).push(item);
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Your application checklist</h1>
        <p className="text-sm text-gray-600">Tailored to your household. Required items must be present before submission.</p>
      </header>
      <Disclaimer variant="compact" />

      <div className="space-y-4">
        {Object.entries(groups).map(([cat, list]) => (
          <div key={cat} className="card card-pad">
            <h2 className="font-semibold">{cat}</h2>
            <ul className="mt-3 divide-y divide-gray-100">
              {list.map((c) => (
                <li key={c.id} className="py-2 flex justify-between gap-3 items-start">
                  <div>
                    <div className="text-sm font-medium">
                      {c.label}{" "}
                      {c.required ? (
                        <span className="text-red-600">*</span>
                      ) : (
                        <span className="text-gray-400 text-xs">(optional)</span>
                      )}
                    </div>
                    {c.notes && <div className="text-xs text-gray-500">{c.notes}</div>}
                  </div>
                  <span
                    className={
                      c.status === "complete"
                        ? "badge-green"
                        : c.status === "uploaded"
                        ? "badge-blue"
                        : "badge-amber"
                    }
                  >
                    {c.status === "complete" ? "Complete" : c.status === "uploaded" ? "Uploaded — under review" : "Open"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card card-pad bg-brand-50 border-brand-200">
        <h3 className="font-semibold">Interview prep</h3>
        <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Be available at your scheduled interview time, with documents nearby.</li>
          <li>Have ID, proof of residence, and the most recent pay stubs in front of you.</li>
          <li>Write down any questions about household composition, income, or expenses ahead of time.</li>
          <li>If you cannot make the interview, contact the county DSS to reschedule.</li>
        </ul>
      </div>
    </div>
  );
}
