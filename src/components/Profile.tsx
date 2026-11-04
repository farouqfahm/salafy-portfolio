import type {
  Award,
  Certification,
  Education,
  Experience,
  Membership,
  Publication,
  Testimonial,
} from "@/lib/content";
import { Country, MediaView, Section, Tag, Txt, fmtDate } from "./ui";
import { resolveCountry } from "@/lib/country";
import { withBase } from "@/lib/base";
import Bi from "./Bi";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

function Initials({ text }: { text: string }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-card font-mono text-[11px] text-mut">
      {text.replace("[REPLACE] ", "").slice(0, 2).toUpperCase()}
    </span>
  );
}

/* ---------- Work experience ---------- */
export function WorkExperience({ items }: { items: Experience[] }) {
  return (
    <Section id="experience" title={<Bi en="Work" ar="الخبرة" />} accent={<Bi en="experience" ar="المهنية" />} sub={<Bi en="Roles and responsibilities." ar="الأدوار والمسؤوليات." />}>
      <div className="overflow-hidden rounded-xl2 border border-line bg-panel">
        {items.map((e, i) => (
          <div key={e.slug} className={`grid gap-4 p-6 md:grid-cols-[220px_1fr] md:p-8 ${i ? "border-t border-line" : ""}`}>
            <div className="font-mono text-xs text-mut">
              <Txt>{e.start}</Txt> — <Txt>{e.end}</Txt>
              <p className="mt-1 font-sans">
                <Txt>{e.location}</Txt>
              </p>
              <Country value={e.country} className="mt-2 font-sans text-soft" />
            </div>
            <div className="flex gap-4">
              {e.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.logo} alt="" className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <Initials text={e.org} />
              )}
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  <Txt>{e.role}</Txt>
                </h3>
                <p className="text-sm text-mut">
                  {e.url ? (
                    <a href={e.url} {...ext} className="hover:text-fg">
                      {e.org} ↗
                    </a>
                  ) : (
                    <Txt>{e.org}</Txt>
                  )}
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-soft">
                  {e.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal" />
                      <Txt>{h}</Txt>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Awards & recognition ---------- */
function AwardVisual({ a }: { a: Award }) {
  if (a.image) {
    return <MediaView m={{ type: "image", src: a.image, alt: a.title, fit: a.imageFit === "contain" ? "contain" : "cover" }} />;
  }
  // No photo yet: a clean result tile built from the award's own facts (flag + result), never a stock image.
  const place = resolveCountry(a.country);
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-card p-5">
      {place?.code && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={withBase(`/flags/${place.code}.svg`)} alt="" className="absolute -right-6 -top-6 h-40 w-60 rotate-6 object-cover opacity-[0.16] blur-[1px]" />
      )}
      <span className="relative font-mono text-[10px] uppercase tracking-widest text-mut">{fmtDate(a.date)}</span>
      <span className="relative text-3xl font-semibold leading-none tracking-tight text-fg">
        <Txt>{a.level || "Award"}</Txt>
      </span>
    </div>
  );
}

export function Awards({ items }: { items: Award[] }) {
  return (
    <Section id="awards" title={<Bi k="awards.title" />} accent={<Bi k="awards.accent" />} sub={<Bi en={`${items.length} awards and recognitions, highlights first.`} ar={`${items.length} جائزة وتكريمًا، الأبرز أولًا.`} />}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => {
          const body = (
            <>
              <div className="aspect-[16/9] overflow-hidden border-b border-line">
                <AwardVisual a={a} />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-signal">
                    <Txt>{a.level}</Txt>
                  </span>
                  <span className="font-mono text-[11px] text-mut">{fmtDate(a.date)}</span>
                </div>
                <p className="mt-2 text-base font-semibold leading-snug">
                  {a.titleAr ? <Bi en={a.title} ar={a.titleAr} /> : <Txt>{a.title}</Txt>}
                </p>
                <p className="mt-1 text-sm text-mut">
                  <Txt>{a.org}</Txt>
                </p>
                {a.note && (
                  <p className="mt-2 text-sm text-soft">
                    <Txt>{a.note}</Txt>
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-4 text-xs text-soft">
                  <Country value={a.country} />
                  {a.url && <span className="text-signal">Source ↗</span>}
                </div>
              </div>
            </>
          );
          const cls = "card-hover flex flex-col overflow-hidden rounded-xl border border-line bg-panel";
          return a.url ? (
            <a key={a.slug} href={a.url} {...ext} className={cls}>
              {body}
            </a>
          ) : (
            <div key={a.slug} className={cls}>
              {body}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ---------- Certifications ---------- */
export function Certifications({ items }: { items: Certification[] }) {
  return (
    <Section id="certifications" title="Certifications">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <div key={c.slug} className="card-hover flex flex-col rounded-xl border border-line bg-panel p-5">
            <div className="flex items-center justify-between">
              <Tag>{c.kind}</Tag>
              <span className="font-mono text-[11px] text-mut">
                <Txt>{c.date}</Txt>
              </span>
            </div>
            <p className="mt-6 text-lg font-semibold tracking-tight">
              <Txt>{c.title}</Txt>
            </p>
            <p className="mt-1 text-sm text-mut">
              <Txt>{c.org}</Txt>
            </p>
            {c.credentialId && <p className="mt-2 font-mono text-[11px] text-mut">ID {c.credentialId}</p>}
            <Country value={c.country} className="mt-3 text-xs text-soft" />
            <div className="mt-auto pt-4">
              {c.url ? (
                <a href={c.url} {...ext} className="text-xs text-signal hover:underline">
                  Verify ↗
                </a>
              ) : (
                <span className="font-mono text-[10px] text-amber">[REPLACE] add verify link</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Education ---------- */
export function EducationList({ items }: { items: Education[] }) {
  return (
    <Section id="education" title="Education" sub="Degrees and professional exams.">
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((e) => (
          <div key={e.slug} className="flex items-center gap-4 rounded-xl border border-line bg-panel p-5">
            <Initials text={e.org} />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold">
                <Txt>{e.title}</Txt>
              </p>
              <p className="text-sm text-mut">
                <Txt>{e.org}</Txt>
              </p>
              {e.detail && <p className="mt-1 text-sm text-signal"><Txt>{e.detail}</Txt></p>}
              {e.thesis && (
                <p className="mt-1.5 text-xs leading-relaxed text-soft">
                  <span className="text-mut">Thesis: </span>
                  <Txt>{e.thesis}</Txt>
                </p>
              )}
              {e.supervisor && (
                <p className="mt-1 text-xs text-mut">
                  Supervisor: <Txt>{e.supervisor}</Txt>
                </p>
              )}
              <Country value={e.country} className="mt-2 text-xs text-soft" />
            </div>
            <div className="text-right">
              <Tag>{e.kind}</Tag>
              <p className="mt-1 font-mono text-[11px] text-mut">
                <Txt>{e.date}</Txt>
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Publications ---------- */
export function Publications({ items }: { items: Publication[] }) {
  return (
    <Section id="publications" title="Publications" sub="Papers, reports, articles and patents.">
      <ol className="divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-panel">
        {items.map((p) => (
          <li key={p.slug} className="grid gap-2 p-5 md:grid-cols-[110px_1fr_auto] md:items-center md:gap-6 md:px-8">
            <span className="font-mono text-xs text-mut">{fmtDate(p.date)}</span>
            <div>
              <p className="font-semibold">
                <Txt>{p.title}</Txt>
              </p>
              <p className="mt-0.5 text-sm text-mut">
                <Txt>{p.authors}</Txt> · <Txt>{p.venue}</Txt>
              </p>
              {p.note && (
                <p className="mt-1 text-xs">
                  <Txt>{p.note}</Txt>
                </p>
              )}
              <Country value={p.country} className="mt-1.5 text-xs text-soft" />
            </div>
            <div className="flex items-center gap-3">
              {p.status && (
                <span className="rounded-full border border-signal/30 bg-signal/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-signal">
                  {p.status}
                </span>
              )}
              <Tag>{p.type}</Tag>
              {p.url && (
                <a href={p.url} {...ext} className="text-xs text-signal hover:underline">
                  Read ↗
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ---------- Memberships ---------- */
export function Memberships({ items }: { items: Membership[] }) {
  return (
    <Section id="memberships" title="Memberships" sub="Networks, bodies and communities.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((m) => {
          const inner = (
            <div className="flex items-center gap-3">
              {m.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.logo} alt="" className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <Initials text={m.org} />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  <Txt>{m.org}</Txt>
                </p>
                <p className="text-xs text-mut">
                  <Txt>{m.role}</Txt> · since <Txt>{m.since}</Txt>
                </p>
                <Country value={m.country} className="mt-1 text-xs text-soft" />
              </div>
            </div>
          );
          const cls = "card-hover block rounded-xl border border-line bg-panel p-4";
          return m.url ? (
            <a key={m.slug} href={m.url} {...ext} className={cls}>
              {inner}
            </a>
          ) : (
            <div key={m.slug} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ---------- Testimonials ---------- */
export function Testimonials({ items }: { items: Testimonial[] }) {
  return (
    <Section id="testimonials" title="Testimonials" sub="What people who worked with Umar say.">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <figure key={t.slug} className="flex flex-col rounded-xl border border-line bg-panel p-6">
            <span className="text-3xl leading-none text-signal" aria-hidden>“</span>
            <blockquote className="mt-4 flex-1 text-lg font-medium leading-snug tracking-tight">
              <Txt>{t.quote}</Txt>
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-4">
              {t.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <Initials text={t.name} />
              )}
              <div className="text-sm">
                <p className="font-medium">
                  {t.url ? (
                    <a href={t.url} {...ext} className="hover:text-signal">
                      {t.name}
                    </a>
                  ) : (
                    <Txt>{t.name}</Txt>
                  )}
                </p>
                <p className="text-xs text-mut">
                  <Txt>{t.role}</Txt>, <Txt>{t.org}</Txt>
                </p>
                <Country value={t.country} className="mt-1 text-xs text-soft" />
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
