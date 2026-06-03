"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";

const ITEMS: { q: string; a: string }[] = [
  {
    q: "Does SNAP AI decide whether I get benefits?",
    a: "No. SNAP AI helps you prepare, organize, and understand the SNAP process. All eligibility decisions are made by trained caseworkers at your state SNAP agency under federal and state law. SNAP AI is preparation support, not an approval system.",
  },
  {
    q: "Is it really free for applicants and recipients?",
    a: "Yes. The applicant- and recipient-facing platform is free, available without an account for basic guidance, and supported by agency partners and philanthropic funding. There is no upsell, no premium tier, and no advertising.",
  },
  {
    q: "What languages is SNAP AI available in?",
    a: "Twelve at launch: English, Spanish, Vietnamese, simplified Chinese, traditional Chinese, Tagalog, Korean, Russian, Arabic, Haitian Creole, Somali, and Hmong. We add languages as agency partners request them.",
  },
  {
    q: "How do agencies use SNAP AI alongside their existing eligibility system?",
    a: "SNAP AI sits beside your existing eligibility system — not on top of it. Applicants prepare their case through SNAP AI; caseworkers receive an organized packet of documents, a readiness score, and any flags for review. The final case is processed in your state's system of record as it is today.",
  },
  {
    q: "What does the 60–90 day pilot cost?",
    a: "Pilot pricing is structured around the size of your county and the intake volume in scope. Most county pilots are mid-five-figures, fully inclusive of configuration, training, and reporting. We share a pricing memo on request.",
  },
  {
    q: "What happens to applicant data after the pilot?",
    a: "All data handling follows your state's policy. By default, applicant data is retained for the period your state requires and deleted on request. SNAP AI does not train models on applicant data and does not share data with third parties.",
  },
  {
    q: "Does SNAP AI determine fraud?",
    a: "No. SNAP AI surfaces flags for human review — identity inconsistencies, duplicate signals, unclear documents — with the underlying evidence attached. Fraud determinations are made by your agency's existing integrity process under state and federal law.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section className="section tight" id="faq" data-screen-label="15 FAQ">
      <div className="shell">
        <div className="section-head center">
          <span className="eyebrow">
            <span className="dot" />
            FAQ
          </span>
          <h2 className="section-title" style={{ textAlign: "center" }}>
            Questions, answered.
          </h2>
        </div>
        <div className="faq">
          {ITEMS.map((it, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            const buttonId = `faq-button-${i}`;
            return (
              <div key={i} className={"faq-item" + (isOpen ? " open" : "")}>
                <button
                  type="button"
                  className="q"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <h5>{it.q}</h5>
                  <Icon.Plus className="icon" />
                </button>
                <div className="a" id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen}>
                  {it.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
