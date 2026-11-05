"use client";
import { useEffect, useRef, useState } from "react";
import { setLang } from "./Translator";

/** First visit: ask the visitor to pick English or Arabic. Shown once, then remembered. */
export default function LangPrompt() {
  const [open, setOpen] = useState(false);
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("lang");
    } catch {}
    if (saved !== "en" && saved !== "ar") setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") pick("en");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pick = (l: "en" | "ar") => {
    setLang(l);
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-title"
      data-no-translate=""
    >
      <div className="w-full max-w-sm rounded-xl2 border border-line bg-panel p-6 text-center shadow-2xl">
        <p id="lang-title" className="text-lg font-semibold">
          Choose your language
          <span lang="ar" dir="rtl" className="mt-1 block font-[family-name:var(--font-arabic)]">
            اختر لغتك
          </span>
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            ref={first}
            type="button"
            onClick={() => pick("en")}
            className="rounded-xl border border-line bg-card px-4 py-4 text-base font-medium hover:border-signal"
          >
            English
          </button>
          <button
            type="button"
            lang="ar"
            dir="rtl"
            onClick={() => pick("ar")}
            className="rounded-xl border border-line bg-card px-4 py-4 text-base font-medium hover:border-signal"
          >
            العربية
          </button>
        </div>
        <p className="mt-4 text-xs text-mut">
          You can change this any time at the top of the page.
          <span lang="ar" dir="rtl" className="mt-1 block">
            يمكنك تغيير اللغة في أي وقت من أعلى الصفحة.
          </span>
        </p>
      </div>
    </div>
  );
}
