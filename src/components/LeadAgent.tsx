"use client";
import { useEffect, useRef, useState } from "react";
import { LEAD_TYPES, NEED_PROMPT, TIMELINES, boardyMailto, type Lead, type LeadType, type Timeline } from "@/lib/leads";
import { site } from "@/lib/site";
import { withBase } from "@/lib/base";

/*
 * Guided lead flow: a short rule-based chat that qualifies a visitor, sends the
 * lead to Umar (/api/leads), then hands them to Boardy (book, or warm intro).
 * It is the FALLBACK path when the AI chat (/api/chat, Bedrock on AWS) is not
 * reachable — e.g. local dev. Rendered embedded inside the Assistant dialog, so
 * this component no longer owns the floating button or the dialog chrome.
 */

type Step = "type" | "need" | "org" | "contact" | "timeline" | "review" | "done";
type Msg = { from: "agent" | "you"; text: string };

export const OPEN_EVENT = "open-lead-agent";

export default function LeadAgent() {
  const [step, setStep] = useState<Step>("type");
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "agent", text: `Hi, I'm Umar's assistant. I'll get you to the right next step in under a minute.` },
    { from: "agent", text: "Who are you reaching out as?" },
  ]);
  const [lead, setLead] = useState<Partial<Lead>>({});
  const [draft, setDraft] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [honey, setHoney] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [msgs, step]);

  const say = (...m: Msg[]) => setMsgs((x) => [...x, ...m]);

  const pickType = (t: LeadType) => {
    setLead((l) => ({ ...l, type: t }));
    say({ from: "you", text: t }, { from: "agent", text: NEED_PROMPT[t] });
    setStep("need");
  };
  const sendNeed = () => {
    if (draft.trim().length < 5) return setErr("A few more words, please.");
    setErr("");
    setLead((l) => ({ ...l, need: draft.trim() }));
    say({ from: "you", text: draft.trim() }, { from: "agent", text: "Which organisation are you with? (Skip if none.)" });
    setDraft("");
    setStep("org");
  };
  const sendOrg = (skip = false) => {
    const org = skip ? "" : draft.trim();
    setLead((l) => ({ ...l, org }));
    say({ from: "you", text: org || "No organisation" }, { from: "agent", text: "Where should Umar reply?" });
    setDraft("");
    setStep("contact");
  };
  const sendContact = () => {
    if (name.trim().length < 2) return setErr("Please add your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setErr("That email looks wrong.");
    setErr("");
    setLead((l) => ({ ...l, name: name.trim(), email: email.trim() }));
    say({ from: "you", text: `${name.trim()} · ${email.trim()}` }, { from: "agent", text: "How soon do you need to talk?" });
    setStep("timeline");
  };
  const pickTimeline = (t: Timeline) => {
    setLead((l) => ({ ...l, timeline: t }));
    say({ from: "you", text: t }, { from: "agent", text: "Here's what I'll pass to Umar. Look right?" });
    setStep("review");
  };
  const submit = async () => {
    if (!consent) return setErr("Please tick the box so I can share this with Umar.");
    setErr("");
    setBusy(true);
    try {
      const r = await fetch(withBase("/api/leads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, website: honey }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Something went wrong");
      say({ from: "agent", text: "Sent to Umar. Pick your next step below." });
      setStep("done");
    } catch (e) {
      setErr(`${(e as Error).message.replace(/\.$/, "")}. You can still email ${site.email}.`);
    } finally {
      setBusy(false);
    }
  };
  const restart = () => {
    setStep("type");
    setLead({});
    setConsent(false);
    setMsgs([{ from: "agent", text: "Who are you reaching out as?" }]);
  };

  const chip = "rounded-full border border-line px-3 py-1.5 text-xs text-soft hover:border-signal hover:text-fg";
  const input =
    "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-fg placeholder:text-mut focus:border-signal focus:outline-none";

  return (
    <>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.from === "you" ? "justify-end" : ""}`}>
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.from === "you" ? "bg-fg text-ink" : "border border-line bg-card text-soft"
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}

        {step === "review" && (
          <dl className="space-y-1 rounded-xl border border-line bg-card p-3 text-xs">
            {(
              [
                ["You are", lead.type],
                ["Need", lead.need],
                ["Organisation", lead.org || "—"],
                ["Contact", `${lead.name} · ${lead.email}`],
                ["Timeline", lead.timeline],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[90px_1fr] gap-2">
                <dt className="text-mut">{k}</dt>
                <dd className="break-words text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        {step === "done" && lead.name && (
          <div className="space-y-2 pt-1">
            <a
              href={site.booking}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary block rounded-xl px-4 py-3 text-sm font-medium"
            >
              Book a time on Boardy →
              <span className="block text-xs font-normal opacity-60">Umar&apos;s calendar at cal.boardy.ai</span>
            </a>
            <a href={boardyMailto(lead as Lead)} className="block rounded-xl border border-line px-4 py-3 text-sm hover:border-soft">
              Ask Boardy for a warm intro ✉
              <span className="block text-xs text-mut">Opens a ready email to boardy@boardy.ai. You review it and send it yourself.</span>
            </a>
            <button onClick={restart} className="text-xs text-mut hover:text-fg">
              Start over
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-line p-3">
        {err && <p className="mb-2 text-xs text-amber">{err}</p>}

        {step === "type" && (
          <div className="flex flex-wrap gap-1.5">
            {LEAD_TYPES.map((t) => (
              <button key={t} onClick={() => pickType(t)} className={chip}>
                {t}
              </button>
            ))}
          </div>
        )}

        {(step === "need" || step === "org") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step === "need") sendNeed();
              else sendOrg();
            }}
            className="flex gap-2"
          >
            <label className="sr-only" htmlFor="agent-input">
              {step === "need" ? "Your message" : "Organisation"}
            </label>
            {step === "need" ? (
              <textarea id="agent-input" rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000} className={input} placeholder="Type here…" autoFocus />
            ) : (
              <input id="agent-input" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={160} className={input} placeholder="Organisation" autoFocus />
            )}
            <div className="flex flex-col gap-1">
              <button type="submit" className="btn-primary rounded-lg px-3 py-2 text-xs font-medium">
                Send
              </button>
              {step === "org" && (
                <button type="button" onClick={() => sendOrg(true)} className="text-[11px] text-mut hover:text-fg">
                  Skip
                </button>
              )}
            </div>
          </form>
        )}

        {step === "contact" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendContact();
            }}
            className="space-y-2"
          >
            <input aria-label="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={input} placeholder="Your name" autoFocus autoComplete="name" />
            <input aria-label="Your email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} className={input} placeholder="you@company.com" autoComplete="email" />
            <button type="submit" className="btn-primary w-full rounded-lg px-3 py-2 text-xs font-medium">
              Continue
            </button>
          </form>
        )}

        {step === "timeline" && (
          <div className="flex flex-wrap gap-1.5">
            {TIMELINES.map((t) => (
              <button key={t} onClick={() => pickTimeline(t)} className={chip}>
                {t}
              </button>
            ))}
          </div>
        )}

        {step === "review" && (
          <div className="space-y-2">
            {/* honeypot for bots; hidden from people and screen readers */}
            <input tabIndex={-1} aria-hidden autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} className="hidden" name="website" />
            <label className="flex items-start gap-2 text-xs text-soft">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-signal" />
              Share these details with Umar so he can reply.
            </label>
            <div className="flex gap-2">
              <button onClick={submit} disabled={busy} className="btn-primary flex-1 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50">
                {busy ? "Sending…" : "Send to Umar"}
              </button>
              <button onClick={restart} className="rounded-lg border border-line px-3 py-2 text-xs text-soft hover:border-soft">
                Edit
              </button>
            </div>
          </div>
        )}

        {step === "done" && <p className="text-center text-[11px] text-mut">Or email {site.email}</p>}
      </div>
    </>
  );
}
