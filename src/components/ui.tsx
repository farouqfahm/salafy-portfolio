import type { ReactNode } from "react";
import type { Media } from "@/lib/content";
import { resolveCountries } from "@/lib/country";
import { withBase } from "@/lib/base";

export function Shell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-shell px-5 md:px-8 ${className}`}>{children}</div>;
}

/** Bordered panel with a header row, matching the "About" card in the reference shots. */
export function Panel({
  id,
  title,
  accent,
  aside,
  children,
}: {
  id?: string;
  title: ReactNode;
  accent?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-10 md:py-14">
      <Shell>
        <div className="overflow-hidden rounded-xl2 border border-line bg-panel">
          <header className="flex flex-col gap-2 border-b border-line px-6 py-6 md:flex-row md:items-end md:justify-between md:px-8">
            <h2 className="text-3xl font-semibold tracking-tight md:text-[44px] md:leading-none">
              {title} {accent && <span className="text-mut">{accent}</span>}
            </h2>
            {aside && <p className="text-sm text-mut">{aside}</p>}
          </header>
          <div className="p-6 md:p-8">{children}</div>
        </div>
      </Shell>
    </section>
  );
}

/** Open section (no outer panel), like "My Skills & Services". */
export function Section({
  id,
  title,
  accent,
  sub,
  right,
  children,
}: {
  id?: string;
  title: ReactNode;
  accent?: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-10 md:py-14">
      <Shell>
        <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-[44px] md:leading-none">
              {title} {accent && <span className="text-mut">{accent}</span>}
            </h2>
            {sub && <p className="mt-3 text-sm text-mut">{sub}</p>}
          </div>
          {right}
        </div>
        {children}
      </Shell>
    </section>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-line bg-card px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-soft">
      {children}
    </span>
  );
}

export function isPlaceholder(s?: string) {
  return !!s && s.includes("[REPLACE]");
}

/** Renders text; anything containing [REPLACE] is visibly flagged so it is never mistaken for a real claim. */
export function Txt({ children, className = "" }: { children?: string; className?: string }) {
  if (!children) return null;
  if (isPlaceholder(children)) {
    return (
      <span className={`${className} rounded bg-amber/10 px-1 text-amber outline outline-1 outline-amber/30`}>
        {children}
      </span>
    );
  }
  return <span className={className}>{children}</span>;
}

export function Btn({
  href,
  children,
  primary,
  external,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
  external?: boolean;
}) {
  const cls = primary
    ? "btn-primary"
    : "border border-line bg-transparent text-fg hover:border-soft";
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${cls}`}
    >
      {children}
      <span aria-hidden>→</span>
    </a>
  );
}

/** Flag + country name. Type any country name (or "Global"/"Africa") and the flag appears. */
export function Country({ value, className = "", showName = true }: { value?: string; className?: string; showName?: boolean }) {
  const places = resolveCountries(value);
  if (!places.length) {
    return isPlaceholder(value) ? <Txt className={className}>{value}</Txt> : null;
  }
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      {places.map((p) => (
        <span key={p.label} className="inline-flex items-center gap-1.5" title={p.label}>
          {p.code ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={withBase(`/flags/${p.code}.svg`)} alt="" width={18} height={12} className="h-3 w-[18px] rounded-[2px] object-cover ring-1 ring-white/10" />
          ) : (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-signal" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.3">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M1.5 8h13M8 1.5c2 2 2.8 4.3 2.8 6.5S10 12.5 8 14.5M8 1.5C6 3.5 5.2 5.8 5.2 8S6 12.5 8 14.5" />
            </svg>
          )}
          {showName && <span>{p.label}</span>}
        </span>
      ))}
    </span>
  );
}

export function fmtDate(d?: string) {
  if (!d || !/^\d{4}-\d{2}/.test(d)) return d || "";
  const dt = new Date(d + (d.length === 10 ? "T00:00:00Z" : ""));
  return dt.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

/** Single media item (image or video). Empty video ids render a marked placeholder. */
export function MediaView({ m, className = "" }: { m: Media; className?: string }) {
  if (m.type === "youtube" || m.type === "vimeo") {
    if (!m.src) {
      return (
        <div className={`flex aspect-video items-center justify-center bg-card font-mono text-xs text-amber ${className}`}>
          [REPLACE] {m.type} video id
        </div>
      );
    }
    const src =
      m.type === "youtube"
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(m.src)}`
        : `https://player.vimeo.com/video/${encodeURIComponent(m.src)}`;
    return (
      <iframe
        className={`aspect-video w-full ${className}`}
        src={src}
        title={m.alt || "Video"}
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (m.type === "video") {
    return (
      <video className={`aspect-video w-full bg-black ${className}`} src={m.src} poster={m.poster} controls preload="metadata">
        {m.alt}
      </video>
    );
  }
  if (m.fit === "contain") {
    // Logos: show the whole mark on a light tile so dark logos stay visible
    return (
      <div className={`flex h-full w-full items-center justify-center bg-[#f4f4f5] p-6 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.src} alt={m.alt || ""} loading="lazy" className="max-h-full max-w-full object-contain" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={m.src} alt={m.alt || ""} loading="lazy" className={`h-full w-full object-cover ${className}`} />
}
