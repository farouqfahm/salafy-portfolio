import type { Proof } from "@/lib/content";
import { Country, Section, Txt, fmtDate } from "./ui";

const ORDER = ["Award", "Grant", "Program", "Pilot", "Patent", "Certification", "Press", "Partner"];

export default function ProofWall({ items }: { items: Proof[] }) {
  const rank = (k: string) => (ORDER.includes(k) ? ORDER.indexOf(k) : 99);
  const kinds = Array.from(new Set(items.map((i) => i.kind))).sort((a, b) => rank(a) - rank(b));
  const ph = (p: Proof) => Number(p.title.includes("[REPLACE]"));
  return (
    <Section id="proof" title="Proof" accent="wall" sub="Grants, programmes, pilots, patents, press and partners.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kinds
          .flatMap((k) => items.filter((i) => i.kind === k))
          // real entries first, placeholders last
          .sort((a, b) => ph(a) - ph(b))
          .map((p) => {
              const inner = (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-signal">{p.kind}</span>
                    {p.url && <span className="text-mut">↗</span>}
                  </div>
                  <div className="mt-6 flex items-center gap-3">
                    {p.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logo} alt={`${p.org} logo`} className="h-10 w-10 shrink-0 rounded-md bg-[#f4f4f5] object-contain p-1" />
                    ) : (
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded border border-line text-[10px] text-mut">
                        {(p.org || p.title).replace("[REPLACE] ", "").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug">
                        <Txt>{p.title}</Txt>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-mut">
                        <Txt>{p.org}</Txt>
                        {p.date ? ` · ${fmtDate(p.date)}` : ""}
                      </p>
                      <Country value={p.country} className="mt-1 text-[11px] text-soft" />
                    </div>
                  </div>
                </>
              );
              const cls = "card-hover block rounded-xl border border-line bg-panel p-4";
              return p.url ? (
                <a key={p.slug} href={p.url} target="_blank" rel="noopener noreferrer" className={cls}>
                  {inner}
                </a>
              ) : (
                <div key={p.slug} className={cls}>
                  {inner}
                </div>
              );
            })}
      </div>
    </Section>
  );
}
