import { NextResponse } from "next/server";

// Local dev / non-AWS stub. On AWS the backend resolves the visitor's country
// (and whether it is in the Arab region) from edge headers. Locally we return a
// neutral answer so the client falls back to timezone/navigator detection.
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ country: null, arab: false });
}
