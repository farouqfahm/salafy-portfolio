import fs from "node:fs/promises";
import path from "node:path";
import { scoreLead, validateLead } from "@/lib/leads";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simple per-IP limit: 5 leads per 10 minutes per server instance.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (limited(ip)) return Response.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  // Honeypot: real visitors never fill the hidden "website" field.
  if (body && typeof body === "object" && (body as Record<string, unknown>).website) {
    return Response.json({ ok: true });
  }

  const v = validateLead(body);
  if ("error" in v) return Response.json({ ok: false, error: v.error }, { status: 400 });

  const { score, tier } = scoreLead(v.lead);
  const record = {
    ...v.lead,
    score,
    tier,
    receivedAt: new Date().toISOString(),
    source: "website-agent",
    bookingLink: site.booking,
  };

  const delivered: string[] = [];

  // 1) Forward to a webhook (Zapier, Make, Slack, Google Sheets, n8n...). Set LEAD_WEBHOOK_URL.
  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook) {
    try {
      const r = await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...record,
          // Slack-style text so the same webhook works for a Slack channel
          text: `New ${tier} lead (${score}/100): ${record.name} · ${record.type}${record.org ? ` · ${record.org}` : ""}\n${record.need}\n${record.email} · ${record.timeline}`,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) delivered.push("webhook");
    } catch (e) {
      console.error("lead webhook failed", e);
    }
  }

  // 2) Local development: also keep a copy in .leads/leads.jsonl (gitignored).
  if (process.env.NODE_ENV !== "production") {
    const dir = path.join(process.cwd(), ".leads");
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(path.join(dir, "leads.jsonl"), JSON.stringify(record) + "\n");
    delivered.push("local-file");
  }

  if (!delivered.length) console.warn("Lead received but LEAD_WEBHOOK_URL is not set:", record.email);

  return Response.json({ ok: true, tier, delivered: delivered.length > 0 });
}
