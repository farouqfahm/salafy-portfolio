"use client";
import { useState } from "react";
import { nav, site } from "@/lib/site";
import { withBase } from "@/lib/base";
import Logo from "./Logo";
import Bi from "./Bi";
import ThemeLangToggle from "./ThemeLangToggle";

export default function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between px-5 md:px-8">
        <a href={withBase("/#top")} className="flex items-center gap-2.5 text-sm font-medium text-fg">
          <Logo className="h-7 w-7 text-fg" />
          <span>{site.alias}</span>
        </a>
        <nav className="hidden items-center gap-5 text-[13px] text-soft xl:flex" aria-label="Primary">
          {nav.map((n) => (
            <a key={n.href} href={withBase(`/${n.href}`)} className="hover:text-fg">
              <Bi k={n.k} />
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeLangToggle />
          <a
            href={site.booking}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary hidden items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium sm:inline-flex"
          >
            <Bi k="btn.book" /> <span aria-hidden>→</span>
          </a>
          <button
            className="rounded-md border border-line px-3 py-1.5 text-xs text-soft xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <Bi k="nav.menu" />
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="grid grid-cols-2 gap-x-4 border-t border-line bg-ink px-5 py-3 xl:hidden" aria-label="Mobile">
          {nav.map((n) => (
            <a key={n.href} href={withBase(`/${n.href}`)} onClick={() => setOpen(false)} className="block py-2 text-sm text-soft">
              <Bi k={n.k} />
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
