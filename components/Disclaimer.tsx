import { SAFETY } from "@/lib/safety";

export function Disclaimer({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "eligibility" | "deadline" | "compact";
  className?: string;
}) {
  const message =
    variant === "eligibility"
      ? `${SAFETY.notGovernment} ${SAFETY.guidanceOnly}`
      : variant === "deadline"
      ? `${SAFETY.guidanceOnly} ${SAFETY.urgent}`
      : variant === "compact"
      ? SAFETY.guidanceOnly
      : `${SAFETY.notGovernment} ${SAFETY.guidanceOnly}`;
  return (
    <div
      role="note"
      className={`rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 ${className}`}
    >
      <span className="font-semibold">Important: </span>
      {message}
    </div>
  );
}
