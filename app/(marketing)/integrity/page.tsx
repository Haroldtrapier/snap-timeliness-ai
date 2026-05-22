import { Disclaimer } from "@/components/Disclaimer";

export default function IntegrityPage() {
  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold">Program integrity — designed for human review</h1>
      <p className="mt-2 text-gray-600 max-w-3xl">
        SNAP AI never makes a fraud determination, never auto-denies a case, and never issues an official finding. The integrity layer surfaces signals that a human reviewer should look at — that is the entire purpose.
      </p>
      <Disclaimer className="mt-4" />

      <section className="mt-8 grid md:grid-cols-2 gap-4">
        <div className="card card-pad">
          <h2 className="font-semibold">Signals we surface (for human review only)</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Identity consistency across documents</li>
            <li>Household validation against application data</li>
            <li>Missing information patterns</li>
            <li>Possible duplicate case or application signals</li>
            <li>Unclear document images</li>
            <li>Indicators related to child identity misuse risk</li>
            <li>Address mismatch across documents</li>
            <li>Income inconsistency across reported sources</li>
          </ul>
        </div>
        <div className="card card-pad">
          <h2 className="font-semibold">Language we use</h2>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="font-medium text-brand-700">We say</div>
              <ul className="mt-1 list-disc pl-5 text-gray-700 space-y-0.5">
                <li>flag for review</li>
                <li>possible inconsistency</li>
                <li>human review required</li>
                <li>preliminary observation</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-red-700">We never say</div>
              <ul className="mt-1 list-disc pl-5 text-gray-700 space-y-0.5">
                <li>fraud detected</li>
                <li>automatic denial</li>
                <li>AI fraud decision</li>
                <li>guaranteed eligibility</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 card card-pad">
        <h2 className="font-semibold">Auditability</h2>
        <p className="mt-2 text-sm text-gray-700">
          Every AI suggestion is logged with the data it saw and the model it used. Every human action on a flag is logged with the worker identity and the disposition. The audit trail is queryable for state and federal review.
        </p>
      </section>
    </div>
  );
}
