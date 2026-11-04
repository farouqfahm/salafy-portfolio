"use client";
import { useEffect, useRef, useState } from "react";
import type { SocialPost } from "@/lib/content";
import { site } from "@/lib/site";
import { Txt, fmtDate } from "./ui";

/*
 * Social feed. LinkedIn and X do not offer a free API that lets a personal site
 * pull your posts automatically, so each post is a small file in /content/social
 * (or one form in /admin) holding the post URL. The site turns that URL into the
 * official embed from each network.
 */

declare global {
  interface Window {
    twttr?: { widgets?: { load: (el?: HTMLElement) => void } };
  }
}

function linkedinEmbed(url: string): string | null {
  // Accepts post links that contain an activity/share/ugcPost id
  const m = url.match(/(activity|share|ugcPost)[:-](\d{10,})/i);
  if (!m) return null;
  const kind = m[1].toLowerCase() === "ugcpost" ? "ugcPost" : m[1].toLowerCase();
  return `https://www.linkedin.com/embed/feed/update/urn:li:${kind}:${m[2]}`;
}

function xUrl(url: string): string | null {
  const m = url.match(/^https:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/);
  return m ? `https://twitter.com/${m[1]}/status/${m[2]}` : null;
}

function Placeholder({ p }: { p: SocialPost }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col justify-between rounded-xl border border-dashed border-line bg-card p-5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-mut">{p.platform === "x" ? "X" : "LinkedIn"}</span>
      <p className="text-sm">
        <Txt>{p.text || "[REPLACE] Paste a post link"}</Txt>
      </p>
      <span className="font-mono text-[11px] text-mut">{fmtDate(p.date)}</span>
    </div>
  );
}

function Post({ p }: { p: SocialPost }) {
  if (p.platform === "linkedin") {
    const src = p.url ? linkedinEmbed(p.url) : null;
    if (!src) return <Placeholder p={p} />;
    return (
      <iframe
        src={src}
        title="LinkedIn post"
        loading="lazy"
        className="h-[520px] w-full rounded-xl border border-line bg-fg"
      />
    );
  }
  const u = p.url ? xUrl(p.url) : null;
  if (!u) return <Placeholder p={p} />;
  return (
    <blockquote className="twitter-tweet" data-theme="dark" data-dnt="true">
      <a href={u}>{p.text || "View post on X"}</a>
    </blockquote>
  );
}

export default function Socials({ items }: { items: SocialPost[] }) {
  const [tab, setTab] = useState<"all" | "linkedin" | "x">("all");
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const shown = tab === "all" ? items : items.filter((p) => p.platform === tab);
  const hasX = shown.some((p) => p.platform === "x" && p.url && xUrl(p.url));

  // Only once this section scrolls into view do we consider loading X's script.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!hasX || !visible) return;
    // Load X's official embed script once (only after the section is in view),
    // then render any tweet blockquotes.
    if (window.twttr?.widgets) {
      window.twttr.widgets.load();
      return;
    }
    const sc = document.createElement("script");
    sc.src = "https://platform.twitter.com/widgets.js";
    sc.async = true;
    document.body.appendChild(sc);
  }, [hasX, tab, visible]);

  return (
    <div ref={rootRef}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5" role="tablist" aria-label="Filter social posts">
          {(
            [
              ["all", "All"],
              ["linkedin", "LinkedIn"],
              ["x", "X"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-1.5 text-xs ${tab === k ? "bg-fg text-ink" : "border border-line text-soft hover:border-soft"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <a href={site.linkedin} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-4 py-1.5 text-xs hover:border-soft">
            Follow on LinkedIn ↗
          </a>
          <a href={site.twitter} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-4 py-1.5 text-xs hover:border-soft">
            Follow on X ↗
          </a>
        </div>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <div key={p.slug}>
            <Post p={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
