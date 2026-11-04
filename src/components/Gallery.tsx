"use client";
import { useCallback, useEffect, useState } from "react";
import type { Media } from "@/lib/content";
import { MediaView } from "./ui";

export default function Gallery({ items }: { items: Media[] }) {
  const photos = items.filter((m) => m.type === "image");
  const videos = items.filter((m) => m.type !== "image");
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {photos.map((m, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            className="card-hover aspect-[4/3] overflow-hidden rounded-xl border border-line"
            aria-label={`Open photo: ${m.alt || i + 1}`}
          >
            <MediaView m={m} />
          </button>
        ))}
      </div>

      {videos.length > 0 && (
        <>
          <p className="label mb-3 mt-8">Videos &amp; talk clips</p>
          <div className="grid gap-3 md:grid-cols-2">
            {videos.map((m, i) => (
              <figure key={i} className="overflow-hidden rounded-xl border border-line bg-card">
                <MediaView m={m} />
                {m.alt && <figcaption className="px-4 py-3 text-xs text-soft">{m.alt}</figcaption>}
              </figure>
            ))}
          </div>
        </>
      )}

      {open !== null && photos[open] && (
        <div
          className="lb-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={close}
        >
          <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[open].src} alt={photos[open].alt || ""} className="max-h-[80vh] w-auto rounded-lg" />
            <figcaption className="mt-3 flex items-center justify-between gap-4 text-sm text-soft">
              <span>{photos[open].alt}</span>
              <span className="font-mono text-xs text-mut">
                {open + 1} / {photos.length}
              </span>
            </figcaption>
          </figure>
          <button onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-4 top-1/2 rounded-full border border-line bg-panel px-3 py-2" aria-label="Previous photo">←</button>
          <button onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-4 top-1/2 rounded-full border border-line bg-panel px-3 py-2" aria-label="Next photo">→</button>
          <button onClick={close} className="absolute right-4 top-4 rounded-full border border-line bg-panel px-3 py-1.5 text-sm" aria-label="Close">Close</button>
        </div>
      )}
    </>
  );
}
