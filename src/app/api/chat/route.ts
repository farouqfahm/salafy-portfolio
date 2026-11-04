import { NextResponse } from "next/server";

// Local dev / non-AWS stub. The real chat runs on AWS (Claude via Bedrock) and
// is wired by the backend build. Returning 503 here makes the client fall back
// to the guided lead flow during local development.
export const dynamic = "force-static";

export async function POST() {
  return NextResponse.json({ ok: false, error: "Chat runs on AWS" }, { status: 503 });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Chat runs on AWS" }, { status: 503 });
}
