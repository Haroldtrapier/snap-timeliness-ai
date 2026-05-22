import { Disclaimer } from "@/components/Disclaimer";

const faqs: [string, string][] = [
  [
    "Is SNAP AI a government agency?",
    "No. SNAP AI is not a government agency. We do not approve, deny, or make any final SNAP eligibility decisions. Final decisions are made by your state SNAP agency.",
  ],
  [
    "Can SNAP AI tell me if I qualify for SNAP?",
    "No. We provide guidance and preparation support only. Use our eligibility check to get a preliminary picture, then apply through your state SNAP agency.",
  ],
  [
    "Does SNAP AI decide who is approved or denied?",
    "No. SNAP AI does not approve or deny anyone. We help you prepare your application, understand notices, track deadlines, and surface things a caseworker should review.",
  ],
  [
    "What about fraud — does SNAP AI flag fraud?",
    "SNAP AI does not detect fraud. Our integrity layer surfaces possible inconsistencies for human review only. Every flag goes to a county or state worker for judgment.",
  ],
  [
    "Is my data safe?",
    "We use Supabase Postgres with row-level security and protected storage. No one outside your account can see your documents. AI calls happen on the server — your data is not sent to the browser-side AI provider.",
  ],
  [
    "How do counties run a pilot?",
    "We run 60–90 day pilots on a sandbox dataset with 3–5 staff users. No real resident data is required for evaluation. See the Pilot page for details.",
  ],
  [
    "Does SNAP AI replace caseworkers?",
    "No. SNAP AI is caseworker support, not replacement. Every meaningful decision stays with a human.",
  ],
  [
    "What languages does SNAP AI support?",
    "Initial release prioritizes English and Spanish, with accessibility options at signup. Additional languages are added in pilot expansion.",
  ],
];

export default function FAQ() {
  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold">Frequently asked questions</h1>
      <Disclaimer className="mt-4" />
      <div className="mt-8 space-y-3">
        {faqs.map(([q, a]) => (
          <details key={q} className="card card-pad">
            <summary className="cursor-pointer font-medium text-gray-900">{q}</summary>
            <p className="mt-2 text-sm text-gray-700">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
