import type { ReactNode } from "react";
import type { CaseStatus, DocStatus, RiskLabel, PriorityTag, AlertSeverity } from "@/lib/backlog/types";

const STATUS_CLASS: Record<CaseStatus, string> = {
  New: "bk-b-blue",
  "Pending Review": "bk-b-cyan",
  "Missing Documents": "bk-b-amber",
  "Expedited Review": "bk-b-purple",
  "Ready for Review": "bk-b-green",
  Overdue: "bk-b-red",
  Completed: "bk-b-gray",
};
export function StatusBadge({ status }: { status: CaseStatus }) {
  return <span className={`bk-badge ${STATUS_CLASS[status] || "bk-b-gray"}`}>{status}</span>;
}

const RISK_CLASS: Record<RiskLabel, string> = { Low: "bk-b-green", Medium: "bk-b-amber", High: "bk-b-red", Critical: "bk-b-red" };
export function RiskBadge({ label }: { label: RiskLabel }) {
  return <span className={`bk-badge ${RISK_CLASS[label]}`}>{label}</span>;
}

const DOC_CLASS: Record<DocStatus, string> = { Missing: "bk-b-red", Requested: "bk-b-amber", Received: "bk-b-blue", Verified: "bk-b-green" };
export function DocBadge({ status }: { status: DocStatus }) {
  return <span className={`bk-badge ${DOC_CLASS[status]}`}>{status}</span>;
}

const TAG_CLASS: Record<PriorityTag, string> = {
  Expedited: "bk-b-purple",
  Overdue: "bk-b-red",
  "Near Deadline": "bk-b-amber",
  "Missing Documents": "bk-b-amber",
  "Ready for Review": "bk-b-green",
  "Worker Review Required": "bk-b-gray",
  "Vulnerable Household": "bk-b-cyan",
};
export function PriorityTags({ tags }: { tags: PriorityTag[] }) {
  return (
    <span className="bk-tags">
      {tags.map((t) => (
        <span key={t} className={`bk-badge ${TAG_CLASS[t] || "bk-b-gray"}`}>
          {t}
        </span>
      ))}
    </span>
  );
}

const SEV_CLASS: Record<AlertSeverity, string> = { Low: "bk-b-gray", Medium: "bk-b-amber", High: "bk-b-red", Critical: "bk-b-red" };
export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return <span className={`bk-badge ${SEV_CLASS[severity]}`}>{severity}</span>;
}

export function PriorityBar({ score, band }: { score: number; band: RiskLabel }) {
  const color = band === "Critical" ? "#dc2626" : band === "High" ? "#ea580c" : band === "Medium" ? "#d97706" : "#16a34a";
  return (
    <div className="bk-row">
      <div className="bk-prbar" title={`Priority ${score}/100`}>
        <div className="bk-prbar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="bk-score" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export function Disclaimer({ text }: { text: string }) {
  return (
    <div className="bk-disclaimer">
      <span className="bk-ic">ⓘ</span>
      <span>{text}</span>
    </div>
  );
}

export function StatCard({
  label,
  value,
  note,
  onClick,
  active,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <div
      className={`bk-card ${onClick ? "click" : ""}`}
      onClick={onClick}
      style={active ? { borderColor: "#2563eb", boxShadow: "0 0 0 2px #bfdbfe" } : undefined}
    >
      <div className="bk-stat-label">{label}</div>
      <div className="bk-stat-value">{value}</div>
      {note ? <div className="bk-stat-note">{note}</div> : null}
    </div>
  );
}
