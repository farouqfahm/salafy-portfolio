"use client";
import { useEffect, useRef, useState } from "react";
import type { Showcase } from "@/lib/content";

/*
 * The real product screenshot (or video) on a CSS MacBook.
 * Motion (all off under prefers-reduced-motion, paused when off screen):
 *   - slow pan across the wide screenshot so the whole UI is seen over time
 *   - pulsing hotspots that ride with the image, with labels from the CMS
 *   - a faint scan line and a rotating caption bar
 * Everything shown comes from content/showcase/climatrixai.md (editable in /admin).
 */

const SCREEN_RATIO = 16 / 10; // MacBook-like screen

export default function ProductShowcase({ data }: { data: Showcase }) {
  const root = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(1.97); // image aspect (w/h); updated on load
  const [active, setActive] = useState(false); // on screen and motion allowed
  const [cap, setCap] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const el = root.current;
    if (!el || !data.motion) return;
    let visible = false;
    const update = () => setActive(visible && !reduce.matches);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      update();
    });
    io.observe(el);
    reduce.addEventListener("change", update);
    return () => {
      io.disconnect();
      reduce.removeEventListener("change", update);
    };
  }, [data.motion]);

  useEffect(() => {
    if (!active || data.captions.length < 2) return;
    const t = setInterval(() => setCap((c) => (c + 1) % data.captions.length), 3800);
    return () => clearInterval(t);
  }, [active, data.captions.length]);

  // Layer is as tall as the screen; its width follows the image so nothing is squashed.
  const layerW = Math.max(100, (ratio / SCREEN_RATIO) * 100); // % of screen width
  const panPct = ((layerW - 100) / layerW) * 100; // how far to slide, % of layer
  const caption = data.captions[cap];

  return (
    <figure ref={root} dir="ltr" className="mx-auto w-full max-w-4xl" aria-label={`${data.product} product screenshot`}>
      {/* Lid */}
      <div className="relative rounded-[18px] bg-[#1d1d1f] p-[1.6%] pb-[2.2%] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
        <span className="absolute left-1/2 top-[0.8%] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#3a3a3c]" aria-hidden />
        <div className="relative overflow-hidden rounded-[6px] bg-black" style={{ aspectRatio: `${SCREEN_RATIO}` }}>
          {data.video ? (
            <video
              className="h-full w-full object-cover"
              src={data.video}
              poster={data.image || undefined}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={data.alt}
            />
          ) : (
            <div
              className="showcase-pan absolute inset-y-0 left-0"
              style={{
                width: `${layerW}%`,
                ["--pan" as string]: `-${panPct}%`,
                animationPlayState: active ? "running" : "paused",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.image}
                alt={data.alt}
                loading="lazy"
                decoding="async"
                width={1800}
                height={914}
                onLoad={(e) => {
                  const i = e.currentTarget;
                  if (i.naturalWidth && i.naturalHeight) setRatio(i.naturalWidth / i.naturalHeight);
                }}
                className="h-full w-full object-cover object-left"
              />
              {data.hotspots.map((h, i) => (
                <span
                  key={i}
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${h.x}%`, top: `${h.y}%` }}
                >
                  <span
                    className="showcase-ping absolute inset-0 rounded-full bg-signal/50"
                    style={{ animationDelay: `${i * 0.6}s`, animationPlayState: active ? "running" : "paused" }}
                    aria-hidden
                  />
                  <span className="relative block h-3 w-3 rounded-full border-2 border-white bg-signal shadow" aria-hidden />
                  <span className={`pointer-events-none absolute whitespace-nowrap ${
                    h.x < 15
                      ? "left-full top-1/2 ms-2 -translate-y-1/2"
                      : h.x > 85
                        ? "right-0 top-full mt-2"
                        : "left-1/2 top-full mt-2 -translate-x-1/2"
                  }`}>
                    <span className="block rounded-md bg-black/80 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                    <span data-lang-en="" lang="en">{h.label}</span>
                    <span data-lang-ar="" lang="ar">{h.labelAr || h.label}</span>
                    </span>
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* scan line + soft vignette */}
          {active && <span className="showcase-scan pointer-events-none absolute inset-x-0 top-0 h-1/3" aria-hidden />}
          <span className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.45)]" aria-hidden />

        </div>
      </div>
      {/* Base */}
      <div className="relative left-1/2 h-[10px] w-[112%] -translate-x-1/2 rounded-b-[14px] bg-gradient-to-b from-[#c7c7cc] to-[#8e8e93] sm:h-[14px]" aria-hidden>
        <span className="absolute left-1/2 top-0 h-[40%] w-[14%] -translate-x-1/2 rounded-b-md bg-[#6e6e73]" />
      </div>
      {/* product name + rotating caption under the laptop */}
      <figcaption className="mt-6 flex flex-wrap items-center justify-center gap-3 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-soft">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-signal" /> {data.product}
        </span>
        {caption && (
          <span key={cap} className="showcase-caption text-sm text-fg" aria-live="polite">
            <span data-lang-en="" lang="en">{caption.en}</span>
            <span data-lang-ar="" lang="ar">{caption.ar || caption.en}</span>
          </span>
        )}
        <span className="sr-only">{data.alt}</span>
      </figcaption>
    </figure>
  );
}
