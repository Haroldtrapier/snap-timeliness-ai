import { Disclaimer } from "@/components/Disclaimer";

const steps = [
  {
    t: "1. Tell us about your household",
    d: "Pick your state and county, your SNAP stage, household size, and basic income. Takes about 2 minutes.",
  },
  {
    t: "2. Get a tailored checklist",
    d: "We generate a document checklist tuned to your stage and household. You always see what's required versus optional.",
  },
  {
    t: "3. Upload safely",
    d: "Upload documents through Supabase Storage with row-level security. We flag unreadable images, expired docs, missing pages, and name/address mismatches for human review.",
  },
  {
    t: "4. Understand notices",
    d: "Paste or upload a notice. SNAP AI returns a plain-language summary, the deadline, the required action, and questions to ask your caseworker.",
  },
  {
    t: "5. Track every deadline",
    d: "Interview dates, document due dates, recertification windows, periodic reports, change reporting deadlines, and appeal windows — all in one place with urgency cues.",
  },
  {
    t: "6. Get human help when it matters",
    d: "SNAP AI does not approve or deny. It surfaces the case to a navigator or caseworker when human judgment is required.",
  },
];

export default function HowItWorks() {
  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold">How SNAP AI works</h1>
      <p className="mt-2 text-gray-600 max-w-2xl">
        Caseworker support, not caseworker replacement. Every step is designed to keep a human in the loop and route urgent issues to your county SNAP office.
      </p>
      <Disclaimer className="mt-4" />
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {steps.map((s) => (
          <div key={s.t} className="card card-pad">
            <div className="font-semibold text-gray-900">{s.t}</div>
            <p className="mt-2 text-sm text-gray-700">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
