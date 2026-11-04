// Shared lead types + rules, used by the chat agent (browser) and /api/leads (server).

export const LEAD_TYPES = [
  "Investor",
  "Grant or funder",
  "Government",
  "Press",
  "Customer or pilot",
  "Founder or partner",
  "Other",
] as const;
export type LeadType = (typeof LEAD_TYPES)[number];

export const TIMELINES = ["This week", "This month", "Just exploring"] as const;
export type Timeline = (typeof TIMELINES)[number];

export type Lead = {
  type: LeadType;
  need: string;
  org: string;
  name: string;
  email: string;
  timeline: Timeline;
};

export const NEED_PROMPT: Record<LeadType, string> = {
  Investor: "What stage and cheque size do you invest at, and what caught your eye?",
  "Grant or funder": "Which programme or call is this about, and is there a deadline?",
  Government: "Which agency, and what climate risk problem are you working on?",
  Press: "Which outlet, what's the story, and when is your deadline?",
  "Customer or pilot": "What do you need to score or monitor, and where?",
  "Founder or partner": "What are you building, and how could you work together?",
  Other: "How can Umar help?",
};

/** Deterministic priority so the same lead always gets the same score. */
export function scoreLead(l: Pick<Lead, "type" | "timeline" | "org" | "need">) {
  const typeW: Record<LeadType, number> = {
    Investor: 40,
    "Grant or funder": 40,
    "Customer or pilot": 35,
    Government: 30,
    Press: 25,
    "Founder or partner": 15,
    Other: 5,
  };
  const timeW: Record<Timeline, number> = { "This week": 30, "This month": 20, "Just exploring": 5 };
  let s = typeW[l.type] + timeW[l.timeline];
  if (l.org.trim()) s += 15;
  if (l.need.trim().length >= 60) s += 15;
  const score = Math.min(100, s);
  const tier = score >= 75 ? "Hot" : score >= 50 ? "Warm" : "Cool";
  return { score, tier };
}

/** Email the visitor can send to Boardy from their own inbox (their approval = sending it). */
export function boardyMailto(l: Lead) {
  const subject = `Ask Boardy: intro to Umar Fahm (ClimatrixAI) — ${l.type}`;
  const body = [
    "Hi Boardy,",
    "",
    `I'm ${l.name}${l.org ? ` from ${l.org}` : ""}. I'd like an introduction to Umar Fahm (Salafy), founder and Chief AI Officer of ClimatrixAI.`,
    "",
    "Who I am",
    `${l.type}${l.org ? `, ${l.org}` : ""}.`,
    "",
    "What I'd like to discuss",
    l.need,
    "",
    `Timeline: ${l.timeline}.`,
    "",
    "Thanks,",
    l.name,
  ].join("\n");
  return `mailto:boardy@boardy.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

/** Server-side validation. Returns a clean lead or an error string. */
export function validateLead(x: unknown): { lead: Lead } | { error: string } {
  if (!x || typeof x !== "object") return { error: "Bad request" };
  const o = x as Record<string, unknown>;
  const str = (k: string, max: number) => (typeof o[k] === "string" ? (o[k] as string).trim().slice(0, max) : "");
  const type = str("type", 40) as LeadType;
  const timeline = str("timeline", 20) as Timeline;
  const lead: Lead = {
    type,
    timeline,
    need: str("need", 2000),
    org: str("org", 160),
    name: str("name", 120),
    email: str("email", 254).toLowerCase(),
  };
  if (!LEAD_TYPES.includes(type)) return { error: "Pick who you are" };
  if (!TIMELINES.includes(timeline)) return { error: "Pick a timeline" };
  if (lead.need.length < 5) return { error: "Tell us a little more" };
  if (lead.name.length < 2) return { error: "Name is required" };
  if (!EMAIL_RE.test(lead.email)) return { error: "Email looks wrong" };
  return { lead };
}
