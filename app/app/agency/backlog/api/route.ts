import { NextResponse } from "next/server";
import { loadBacklogState, applyBacklogAction, isBacklogServerBacked } from "@/lib/backlog/repository";
import type { BacklogAction } from "@/lib/backlog/actions";

// GET  → { backed, state? }  : the persisted backlog for the signed-in owner
// POST → { backed, ok }      : apply one mutation
// When Supabase is not configured (or a demo session), `backed` is false and the
// client store transparently uses its localStorage demo state instead.

export async function GET() {
  const backed = await isBacklogServerBacked();
  if (!backed) return NextResponse.json({ backed: false });
  const state = await loadBacklogState();
  return NextResponse.json({ backed: state !== null, state });
}

export async function POST(req: Request) {
  let action: BacklogAction;
  try {
    action = (await req.json()) as BacklogAction;
  } catch {
    return NextResponse.json({ backed: false, ok: false, error: "invalid body" }, { status: 400 });
  }
  const ok = await applyBacklogAction(action);
  return NextResponse.json({ backed: ok, ok });
}
