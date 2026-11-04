import type { Recognizer } from "@/lib/content";
import { Shell } from "./ui";
import Bi from "./Bi";

/* "Recognized by" logo row: greyscale, colours on hover. A slow marquee on
 * small screens (paused on hover / reduced motion via globals.css). Each logo
 * sits on a light pill so dark marks stay visible on the dark theme. */
function LogoItem({ r }: { r: Recognizer }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={r.logo}
      alt={r.name}
      loading="lazy"
      className="max-h-9 w-auto object-contain opacity-90 transition group-hover:opacity-100"
    />
  );
  const tile = (
    <span className="group grid h-14 min-w-[120px] place-items-center rounded-xl border border-line bg-[rgb(var(--tile))] px-5 grayscale transition hover:grayscale-0">
      {img}
    </span>
  );
  return r.url ? (
    <a href={r.url} target="_blank" rel="noopener noreferrer" title={r.name} className="shrink-0">
      {tile}
    </a>
  ) : (
    <span title={r.name} className="shrink-0">
      {tile}
    </span>
  );
}

export default function Recognizers({ items }: { items: Recognizer[] }) {
  if (!items.length) return null;
  return (
    <section className="border-y border-line py-8" aria-label="Recognized by">
      <Shell>
        <p className="label mb-5 text-center">
          <Bi k="hero.recognizedBy" />
        </p>
        {/* Desktop: static wrap row */}
        <div className="hidden flex-wrap items-center justify-center gap-4 sm:flex">
          {items.map((r) => (
            <LogoItem key={r.slug} r={r} />
          ))}
        </div>
        {/* Mobile: marquee (duplicated track for a seamless loop) */}
        <div className="marquee-wrap overflow-hidden sm:hidden">
          <div className="marquee gap-4">
            {[...items, ...items].map((r, i) => (
              <LogoItem key={`${r.slug}-${i}`} r={r} />
            ))}
          </div>
        </div>
      </Shell>
    </section>
  );
}
