import type { BlogPost, Update } from "@/lib/content";
import OpenAgentButton from "./OpenAgentButton";
import { footerLinks, site } from "@/lib/site";
import { Country, MediaView, Panel, Section, Txt, fmtDate, Shell } from "./ui";
import { withBase } from "@/lib/base";
import Bi from "./Bi";
import Logo from "./Logo";

/* ---------- Updates: running log styled like mission telemetry ---------- */
export function Updates({ items }: { items: Update[] }) {
  return (
    <Panel id="updates" title="Updates" aside="Running log, newest first">
      <div className="mb-4 flex items-center justify-between">
        <span className="label">Log · {items.length} entries</span>
        <a href={withBase("/rss.xml")} className="font-mono text-[11px] text-signal hover:underline">
          RSS feed ↗
        </a>
      </div>
      <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card font-mono">
        {items.map((u) => (
          <li key={u.slug} className="grid gap-2 px-4 py-4 md:grid-cols-[120px_110px_1fr] md:gap-6">
            <div className="text-[12px] text-mut">
              <time dateTime={u.date}>{u.date}</time>
              <Country value={u.country} className="mt-1 block font-sans text-[11px] text-soft" />
            </div>
            <span>
              <span className="rounded border border-signal/30 bg-signal/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-signal">
                {u.tag}
              </span>
            </span>
            <div className="font-sans">
              <p className="text-sm leading-relaxed text-soft">
                {u.textAr ? <Bi en={u.text} ar={u.textAr} /> : <Txt>{u.text}</Txt>}
              </p>
              {u.media.length > 0 && (
                <div className="mt-3 grid max-w-md grid-cols-2 gap-2">
                  {u.media.map((m, i) => (
                    <div key={i} className="aspect-video overflow-hidden rounded-lg border border-line">
                      <MediaView m={m} />
                    </div>
                  ))}
                </div>
              )}
              {u.links.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {u.links.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="text-signal hover:underline">
                      {l.label} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/* ---------- Blog preview ---------- */
export function BlogPreview({ items }: { items: BlogPost[] }) {
  return (
    <Section
      id="blog"
      title="Stories"
      accent="& writing"
      sub="Notes from the field. Also shared on LinkedIn and X."
      right={
        <div className="flex gap-2">
          <a href={site.linkedin} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-4 py-1.5 text-xs hover:border-soft">
            LinkedIn ↗
          </a>
          <a href={site.twitter} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-4 py-1.5 text-xs hover:border-soft">
            X / Twitter ↗
          </a>
          <a href={withBase("/blog")} className="rounded-full btn-primary px-4 py-1.5 text-xs font-medium ">
            All stories →
          </a>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {items.slice(0, 3).map((b) => (
          <a key={b.slug} href={withBase(`/blog/${b.slug}`)} className="card-hover overflow-hidden rounded-xl border border-line bg-panel">
            {b.cover && (
              <div className="aspect-[16/9] overflow-hidden border-b border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.cover} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-mut">{fmtDate(b.date)}</span>
                <Country value={b.country} className="text-[11px] text-soft" />
              </div>
              <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight">
                <Txt>{b.title}</Txt>
              </h3>
              <p className="mt-2 text-sm text-soft">
                <Txt>{b.summary}</Txt>
              </p>
            </div>
          </a>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Contact: frictionless, like "Ready to build" footer card ---------- */
export function Contact() {
  const rows = [
    { k: "Email", v: site.email, href: `mailto:${site.email}` },
    ...(site.phone ? [{ k: "Phone", v: site.phone, href: `tel:${site.phone.replace(/\s+/g, "")}` }] : []),
    { k: "Company", v: "climatrixai.com", href: site.website },
    { k: "LinkedIn", v: "in/farouqfahm", href: site.linkedin },
  ];
  return (
    <section id="contact" className="scroll-mt-24 py-10 md:py-14">
      <Shell>
        <div className="relative overflow-hidden rounded-xl2 border border-line bg-panel">
          <div className="hero-glow pointer-events-none absolute inset-0 opacity-70" aria-hidden />
          <div className="relative p-6 md:p-12">
            <div className="mb-6 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={withBase("/media/avatar.jpg")} alt="Umar Fahm" className="h-11 w-11 rounded-full border border-line object-cover" />
              <div className="text-sm">
                <p className="font-medium">{site.name}</p>
                <p className="text-xs text-mut">Founder &amp; Chief AI Officer, ClimatrixAI</p>
              </div>
            </div>
            <h2 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
              <Bi k="contact.heading1" />
              <br />
              <span className="text-mut"><Bi k="contact.heading2" /></span>
            </h2>
            <p className="mt-4 max-w-lg text-sm text-soft">
              <Bi k="contact.body" />
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={site.booking}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full btn-primary px-5 py-3 text-sm font-medium "
              >
                Book a meeting <span aria-hidden>→</span>
              </a>
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm hover:border-soft"
              >
                Email {site.email}
              </a>
              <OpenAgentButton />
            </div>
            <dl className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
              {rows.map((r) => (
                <a key={r.k} href={r.href} target={r.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="bg-panel p-4 hover:bg-card">
                  <dt className="text-xs text-mut">{r.k}</dt>
                  <dd className="mt-1 text-sm">{r.v}</dd>
                </a>
              ))}
            </dl>
          </div>
        </div>
        <footer className="mt-10 border-t border-line pt-10">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <a href={withBase("/#top")} className="flex items-center gap-2.5 text-sm font-medium text-fg">
                <Logo className="h-7 w-7 text-fg" /> {site.alias}
              </a>
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-mut">{site.tagline}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <a href={site.linkedin} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 hover:border-soft">LinkedIn ↗</a>
                <a href={site.twitter} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 hover:border-soft">X ↗</a>
                <a href={site.website} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 hover:border-soft">climatrixai.com ↗</a>
              </div>
            </div>
            <nav aria-label="Sitemap">
              <p className="label mb-3"><Bi k="footer.sitemap" /></p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-soft">
                {footerLinks.map((l) => (
                  <li key={l.href}>
                    <a href={withBase(l.href)} className="hover:text-fg"><Bi k={l.k} /></a>
                  </li>
                ))}
                <li><a href={withBase("/rss.xml")} className="hover:text-fg">RSS</a></li>
                <li><a href={withBase("/admin/")} className="hover:text-fg">Admin</a></li>
              </ul>
            </nav>
          </div>
          <p className="mt-8 flex flex-col justify-between gap-2 border-t border-line pt-6 text-xs text-mut sm:flex-row">
            <span>© {new Date().getFullYear()} <Bi k="footer.rights" /></span>
          </p>
        </footer>
      </Shell>
    </section>
  );
}
