"use client";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { withBase } from "@/lib/base";
import { site } from "@/lib/site";
import { DICT, type Lang } from "@/lib/i18n";
import LeadAgent, { OPEN_EVENT } from "./LeadAgent";

/*
 * Chat assistant. Real chat talks to /api/chat (Claude via Bedrock on AWS).
 * If that is unreachable (local dev 503/404/5xx/network), it switches to the
 * guided lead flow (LeadAgent) so the visitor can still reach Umar.
 *
 * - Free-text input + quick-reply chips
 * - Reply text rendered SAFELY (escaped, with autolinked URLs — no HTML inject)
 * - "Book a call" button when the API returns booking_url
 * - Conversation kept in sessionStorage
 * - Accessible dialog: role=dialog, focus trap-ish, Esc closes
 */

type Role = "user" | "assistant";
type ChatMsg = { role: Role; content: string };

const STORE_KEY = "umar-chat-v1";

function currentLang(): Lang {
  if (typeof document === "undefined") return "en";
  return (document.documentElement.getAttribute("data-lang") as Lang) || "en";
}
function tr(key: string): string {
  const e = DICT[key];
  const lang = currentLang();
  return e ? e[lang] || e.en : key;
}

// Escape, then autolink http(s) URLs and bare emails. Returns React nodes — no
// dangerouslySetInnerHTML, so model output can never inject markup.
function renderSafe(text: string) {
  const parts = text.split(/(\bhttps?:\/\/[^\s<>()]+|\b[\w.+-]+@[\w-]+\.[\w.-]+\b)/g);
  return parts.map((p, i) => {
    if (/^https?:\/\//.test(p)) {
      return (
        <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-signal underline underline-offset-2">
          {p}
        </a>
      );
    }
    if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(p)) {
      return (
        <a key={i} href={`mailto:${p}`} className="text-signal underline underline-offset-2">
          {p}
        </a>
      );
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [guided, setGuided] = useState(false); // fell back to the rule-based flow
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // restore conversation
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) setMsgs(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-40)));
    } catch {
      /* ignore */
    }
  }, [msgs]);

  // open via the global event (buttons across the page) + remember focus origin
  useEffect(() => {
    const h = () => {
      openerRef.current = (document.activeElement as HTMLElement) || null;
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, h);
    return () => window.removeEventListener(OPEN_EVENT, h);
  }, []);

  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [msgs, open, guided]);

  // focus management + Esc
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    openerRef.current?.focus?.();
  }, [open]);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...msgs, { role: "user" as Role, content }];
    setMsgs(next);
    setDraft("");
    setBusy(true);
    try {
      const r = await fetch(withBase("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, lang: currentLang() }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json().catch(() => ({ ok: false }));
      if (!j.ok || !j.reply) throw new Error(j.error || "bad reply");
      setMsgs((m) => [...m, { role: "assistant", content: String(j.reply) }]);
      if (j.booking_url) setBookingUrl(String(j.booking_url));
    } catch {
      // Chat backend not available → hand over to the guided flow.
      setGuided(true);
    } finally {
      setBusy(false);
    }
  };

  const quick = ["chat.q1", "chat.q2", "chat.q3", "chat.q4"];

  return (
    <>
      {!open && (
        <button
          onClick={() => {
            openerRef.current = null;
            setOpen(true);
          }}
          className="btn-primary fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-2xl"
          aria-label={tr("chat.open")}
        >
          <span className="pulse-dot h-2 w-2 rounded-full bg-signal-dim" /> <span lang={currentLang()}>{tr("chat.open")}</span>
        </button>
      )}

      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={tr("chat.title")}
          onKeyDown={onKey}
          className="fixed inset-x-3 bottom-3 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-xl2 border border-line bg-panel shadow-2xl sm:inset-x-auto sm:end-5 sm:w-[400px]"
        >
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={withBase("/media/avatar.jpg")} alt="" className="h-8 w-8 rounded-full border border-line object-cover" />
              <div>
                <p className="text-sm font-medium">{tr("chat.title")}</p>
                <p className="text-[11px] text-mut">{tr("chat.subtitle")}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-xs text-mut hover:text-fg" aria-label={tr("chat.close")}>
              ✕
            </button>
          </header>

          {guided ? (
            // Fallback: the rule-based guided flow (same dialog chrome)
            <LeadAgent />
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4" aria-live="polite">
                {msgs.length === 0 && (
                  <p className="rounded-2xl border border-line bg-card px-3 py-2 text-sm text-soft">
                    {tr("chat.title")} — {tr("chat.subtitle")}.
                  </p>
                )}
                {msgs.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
                    <p
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                        m.role === "user" ? "bg-fg text-ink" : "border border-line bg-card text-soft"
                      }`}
                    >
                      {renderSafe(m.content)}
                    </p>
                  </div>
                ))}
                {busy && <p className="px-1 text-xs text-mut">{tr("chat.thinking")}</p>}
                {bookingUrl && (
                  <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary block rounded-xl px-4 py-2.5 text-center text-sm font-medium">
                    {tr("chat.booking")} →
                  </a>
                )}
                <div ref={endRef} />
              </div>

              <div className="border-t border-line p-3">
                {msgs.length === 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {quick.map((k) => (
                      <button
                        key={k}
                        onClick={() => send(tr(k))}
                        className="rounded-full border border-line px-3 py-1.5 text-xs text-soft hover:border-signal hover:text-fg"
                      >
                        {tr(k)}
                      </button>
                    ))}
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(draft);
                  }}
                  className="flex gap-2"
                >
                  <label htmlFor="chat-input" className="sr-only">
                    {tr("chat.placeholder")}
                  </label>
                  <textarea
                    id="chat-input"
                    ref={inputRef}
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(draft);
                      }
                    }}
                    maxLength={2000}
                    className="w-full resize-none rounded-lg border border-line bg-ink px-3 py-2 text-sm text-fg placeholder:text-mut focus:border-signal focus:outline-none"
                    placeholder={tr("chat.placeholder")}
                  />
                  <button type="submit" disabled={busy} className="btn-primary rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50">
                    {tr("chat.send")}
                  </button>
                </form>
                <p className="mt-2 text-center text-[11px] text-mut">{tr("chat.privacy")}</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
