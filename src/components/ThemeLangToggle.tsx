"use client";
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { withBase } from "@/lib/base";

type Theme = "dark" | "light";

function readAttr(name: string): string {
  if (typeof document === "undefined") return "";
  return document.documentElement.getAttribute(name) || "";
}

function applyLang(lang: Lang) {
  const d = document.documentElement;
  d.setAttribute("data-lang", lang);
  d.setAttribute("lang", lang);
  d.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/** Sun/moon theme toggle + EN|عربي language toggle. State mirrors the <html>
 *  attributes the pre-paint inline script already set, so there is no flash. */
export default function ThemeLangToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLang] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTheme((readAttr("data-theme") as Theme) || "dark");
    setLang((readAttr("data-lang") as Lang) || "en");
    setReady(true);

    // First-visit auto-detect: only when the user has not chosen a language yet.
    if (!localStorage.getItem("lang")) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 1500);
      fetch(withBase("/api/geo"), { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          clearTimeout(timer);
          if (j && j.arab && !localStorage.getItem("lang")) {
            applyLang("ar");
            setLang("ar");
          }
        })
        .catch(() => {
          /* timezone/navigator fallback already ran in the pre-paint script */
        });
      return () => {
        clearTimeout(timer);
        ctrl.abort();
      };
    }
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("theme", next);
  };
  const setLanguage = (next: Lang) => {
    setLang(next);
    applyLang(next);
    localStorage.setItem("lang", next);
  };

  return (
    <div className="flex items-center gap-1.5" suppressHydrationWarning>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        title="Toggle theme"
        className="grid h-8 w-8 place-items-center rounded-md border border-line text-soft hover:text-fg"
      >
        {ready && theme === "dark" ? (
          // moon
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M16 11.5A6 6 0 1 1 8.5 4 4.8 4.8 0 0 0 16 11.5Z" />
          </svg>
        ) : (
          // sun
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <circle cx="10" cy="10" r="3.4" />
            <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6 16 16M16 4l-1.4 1.4M5.4 14.6 4 16" />
          </svg>
        )}
      </button>
      <div className="flex overflow-hidden rounded-md border border-line text-[11px]" role="group" aria-label="Language">
        <button
          type="button"
          onClick={() => setLanguage("en")}
          aria-pressed={lang === "en"}
          className={`px-2 py-1 ${lang === "en" ? "bg-fg text-ink" : "text-soft hover:text-fg"}`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage("ar")}
          aria-pressed={lang === "ar"}
          lang="ar"
          className={`px-2 py-1 ${lang === "ar" ? "bg-fg text-ink" : "text-soft hover:text-fg"}`}
        >
          عربي
        </button>
      </div>
    </div>
  );
}
