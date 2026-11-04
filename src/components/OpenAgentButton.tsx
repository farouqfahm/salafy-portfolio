"use client";
import type { ReactNode } from "react";
import { OPEN_EVENT } from "./LeadAgent";

export default function OpenAgentButton({ className = "", label }: { className?: string; label?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className={`inline-flex items-center gap-2 rounded-full border border-signal/40 bg-signal/10 px-5 py-3 text-sm text-signal hover:bg-signal/20 ${className}`}
    >
      <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-signal" /> {label ?? "Tell the assistant what you need"}
    </button>
  );
}
