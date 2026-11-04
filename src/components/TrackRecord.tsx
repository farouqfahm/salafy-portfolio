import type { Achievement } from "@/lib/content";
import { Country, Section, Txt, MediaView, fmtDate } from "./ui";
import { resolveCountries, type Place } from "@/lib/country";
import { withBase } from "@/lib/base";
import Bi from "./Bi";

/** Countries where Umar has been recognised. Built from each entry's `country` field. */
function RecognisedIn({ items }: { items: Achievement[] }) {
  const counts = new Map<string, { place: Place; n: number }>();
  let regional = 0;
  for (const a of items) {
    for (const p of resolveCountries(a.country)) {
      if (!p.code) {
        regional++;
        continue;
      }
      const cur = counts.get(p.code);
      counts.set(p.code, { place: p, n: (cur?.n || 0) + 1 });
    }
  }
  const list = Array.from(counts.values()).sort((x, y) => y.n - x.n || x.place.label.localeCompare(y.place.label));
  return (
    <div className="rounded-xl2 border border-line bg-card p-5">
      <span className="label">Recognised in</span>
      <p className="mt-3 text-5xl font-semibold tracking-tight">
        {list.length}
        <span className="ml-2 text-base font-normal text-mut">countries &amp; regions</span>
      </p>
      <ul className="mt-5 grid grid-cols-2 gap-2">
        {list.map(({ place, n }) => (
          <li key={place.code} className="flex items-center gap-3 rounded-lg border border-line bg-panel p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={withBase(`/flags/${place.code}.svg`)} alt="" className="h-6 w-9 shrink-0 rounded-[3px] object-cover ring-1 ring-white/10" />
            <span className="min-w-0">
              <span className="block text-sm leading-tight">{place.label}</span>
              <span className="font-mono text-[10px] text-mut">
                {n} {n === 1 ? "recognition" : "recognitions"}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {regional > 0 && (
        <p className="mt-3 flex items-center gap-2 text-xs text-soft">
          <Country value="Global" showName={false} />
          Plus {regional} global and pan-African programmes
        </p>
      )}
    </div>
  );
}

function Entry({ a }: { a: Achievement }) {
  const m = a.media[0];
  return (
    <li className="relative pb-8 last:pb-0">
      <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-ink bg-signal md:-left-[37px]" />
      <div className="grid gap-4 md:grid-cols-[1fr_168px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-mut">
            <span>{fmtDate(a.date)}</span>
            {a.country && (
              <>
                <span>·</span>
                <Country value={a.country} className="text-soft" />
              </>
            )}
            {a.location && !a.location.toLowerCase().includes(a.country.toLowerCase() || "\u0000") && (
              <>
                <span>·</span>
                <Txt>{a.location}</Txt>
              </>
            )}
          </div>
          <h3 className="mt-2 text-lg font-semibold tracking-tight md:text-xl">
            {a.titleAr ? <Bi en={a.title} ar={a.titleAr} /> : <Txt>{a.title}</Txt>}
          </h3>
          {(a.org || a.level) && (
            <p className="mt-1 text-sm text-mut">
              {a.level && <span className="mr-2 font-mono text-[11px] uppercase tracking-wider text-signal">{a.level}</span>}
              <Txt>{a.org}</Txt>
            </p>
          )}
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-soft">
            <Txt>{a.body}</Txt>
          </p>
          {a.metrics.length > 0 && (
            <dl className="mt-4 flex max-w-2xl flex-wrap overflow-hidden rounded-xl border border-line bg-panel">
              {a.metrics.map((x) => (
                <div key={x.label} className="min-w-[130px] flex-1 border-r border-line px-4 py-3 last:border-r-0">
                  <dd className="text-xl font-semibold tracking-tight">
                    <Txt>{String(x.value)}</Txt>
                  </dd>
                  <dt className="mt-0.5 text-xs text-mut">
                    <Txt>{x.label}</Txt>
                  </dt>
                </div>
              ))}
            </dl>
          )}
          {a.links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              {a.links.map((l) => (
                <a key={l.url + l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="text-signal hover:underline">
                  <Txt>{l.label}</Txt> ↗
                </a>
              ))}
            </div>
          )}
        </div>
        {m && (
          <div className="aspect-[4/3] w-40 overflow-hidden rounded-xl border border-line md:w-full">
            <MediaView m={m} />
          </div>
        )}
      </div>
    </li>
  );
}

function YearGroups({ items }: { items: Achievement[] }) {
  const years = Array.from(new Set(items.map((a) => a.date.slice(0, 4))));
  return (
    <>
      {years.map((y) => (
        <div key={y}>
          <p className="relative -ml-6 mb-5 mt-2 font-mono text-xs tracking-widest text-mut md:-ml-8">
            <span className="bg-ink pr-3">{y}</span>
          </p>
          <ol>
            {items.filter((a) => a.date.startsWith(y)).map((a) => (
              <Entry key={a.slug} a={a} />
            ))}
          </ol>
        </div>
      ))}
    </>
  );
}

export default function TrackRecord({ items }: { items: Achievement[] }) {
  // Strictly by date, newest first. The 10 newest show; the rest open with "Show more".
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
  const first = sorted.slice(0, 10);
  const rest = sorted.slice(10);
  return (
    <Section id="track-record" title={<Bi k="track.title" />} accent={<Bi k="track.accent" />} sub={<Bi en={`${items.length} milestones since January 2025, newest first.`} ar={`${items.length} محطة منذ يناير 2025، الأحدث أولًا.`} />}>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="relative border-l border-line pl-6 md:pl-8">
          <YearGroups items={first} />
          {rest.length > 0 && (
            <details className="group mt-8">
              <summary className="-ml-6 inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-line bg-ink px-4 py-2 text-sm text-soft hover:border-soft md:-ml-8">
                <span className="group-open:hidden">Show {rest.length} more milestones ↓</span>
                <span className="hidden group-open:inline">Show fewer ↑</span>
              </summary>
              <div className="mt-8">
                <YearGroups items={rest} />
              </div>
            </details>
          )}
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <RecognisedIn items={items} />
        </div>
      </div>
    </Section>
  );
}
