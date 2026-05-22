import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";

export default function ForApplicants() {
  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold">For applicants</h1>
      <p className="mt-2 text-gray-600 max-w-2xl">
        New to SNAP or in the middle of applying? SNAP AI helps you understand requirements, prepare every document, and stay ahead of deadlines.
      </p>
      <Disclaimer variant="eligibility" className="mt-4" />
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        {[
          ["Tailored checklist", "Required vs. optional documents based on your household."],
          ["Document review", "Photo quality, expiration, name and address consistency — all checked before submission."],
          ["Notice explainer", "Paste any notice to get a plain-language summary, deadline, and required action."],
          ["Deadline tracker", "Interview, document, and recertification deadlines in one place."],
          ["Assistant", "Ask plain-language questions and get safe, guidance-only answers."],
          ["Navigator referral", "When something needs human judgment, we connect you to a navigator or your county office."],
        ].map(([t, d]) => (
          <div key={t} className="card card-pad">
            <div className="font-semibold">{t}</div>
            <p className="mt-1 text-sm text-gray-700">{d}</p>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <Link href="/signup" className="btn-primary">Start preparing</Link>
      </div>
    </div>
  );
}
