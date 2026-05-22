import { Disclaimer } from "@/components/Disclaimer";

export default function ForRecipients() {
  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold">For current SNAP recipients</h1>
      <p className="mt-2 text-gray-600 max-w-2xl">
        Stay on benefits without surprises. Recertification reminders, change reporting support, and EBT budgeting all live in one place.
      </p>
      <Disclaimer className="mt-4" />
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {[
          ["Recertification reminders", "We track your recertification window and remind you weeks in advance so you don't lose benefits."],
          ["Change reporting support", "Income, household, or address changed? We explain what to report, when, and how."],
          ["Benefit budget planner", "Plan your monthly EBT around rent, utilities, and household needs."],
          ["Grocery planning", "Build a weekly grocery plan around your EBT amount with SNAP-eligible food guidance."],
          ["Food resource referrals", "Food banks, pantries, summer EBT for kids, WIC — surfaced based on your county."],
          ["Periodic reports", "Six-month and interim report support so you don't miss state requirements."],
        ].map(([t, d]) => (
          <div key={t} className="card card-pad">
            <div className="font-semibold">{t}</div>
            <p className="mt-1 text-sm text-gray-700">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
