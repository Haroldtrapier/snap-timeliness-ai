import { NextResponse } from "next/server";
import { SAFETY } from "@/lib/safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function guessType(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("id") || n.includes("license") || n.includes("passport")) return "Photo ID";
  if (n.includes("paystub") || n.includes("pay_stub") || n.includes("paycheck")) return "Pay Stub";
  if (n.includes("ssn") || n.includes("social")) return "Social Security";
  if (n.includes("lease") || n.includes("rent")) return "Lease / Rent Statement";
  if (n.includes("utility") || n.includes("electric") || n.includes("water") || n.includes("gas")) return "Utility Bill";
  if (n.includes("tax") || n.includes("1040") || n.includes("w2")) return "Tax Return";
  if (n.includes("childcare") || n.includes("daycare")) return "Childcare Receipt";
  if (n.includes("medical") || n.includes("rx") || n.includes("prescription")) return "Medical Expense";
  return "Unknown";
}

function checklistMap(type: string): string | null {
  const map: Record<string, string> = {
    "Photo ID": "id1",
    "Utility Bill": "res1",
    "Lease / Rent Statement": "exp1",
    "Pay Stub": "inc1",
    "Tax Return": "inc2",
    "Childcare Receipt": "child1",
    "Medical Expense": "med1",
  };
  return map[type] ?? null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const filename: string = typeof body?.filename === "string" ? body.filename : "";
    const sizeBytes: number = typeof body?.sizeBytes === "number" ? body.sizeBytes : 0;
    if (!filename) {
      return NextResponse.json({ error: "filename required" }, { status: 400 });
    }

    const type = guessType(filename);
    const mappedTo = checklistMap(type);

    const flags: string[] = [];
    if (sizeBytes > 0 && sizeBytes < 30_000) flags.push("possible unreadable image (very small file)");
    if (filename.toLowerCase().endsWith(".heic")) flags.push("HEIC format — may need conversion for caseworker review");
    if (type === "Unknown") flags.push("wrong document type or unrecognized — human review required");

    return NextResponse.json({
      detectedType: type,
      mappedTo,
      flags,
      humanReviewRequired: flags.length > 0,
      disclaimer: SAFETY.humanReview,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
