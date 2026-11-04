import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/content";
import { site, SITE_URL } from "@/lib/site";
import { withBase } from "@/lib/base";
import { Country, Shell, Tag, Txt, fmtDate } from "@/components/ui";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Stories · ${site.name}`,
  description: "Notes from the field by Umar Fahm (Salafy), founder of ClimatrixAI.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const posts = getBlogPosts();
  return (
    <Shell className="py-14 md:py-20">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", url: `${SITE_URL}/` }, { name: "Stories", url: `${SITE_URL}/blog` }])} />
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-mut">
        <ol className="flex items-center gap-1.5">
          <li><a href={withBase("/")} className="hover:text-fg">Home</a></li>
          <li aria-hidden>/</li>
          <li className="text-soft" aria-current="page">Stories</li>
        </ol>
      </nav>
      <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
        Stories <span className="text-mut">&amp; writing</span>
      </h1>
      <p className="mt-4 text-sm text-mut">
        Also on{" "}
        <a className="text-signal hover:underline" href={site.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>{" "}
        and{" "}
        <a className="text-signal hover:underline" href={site.twitter} target="_blank" rel="noopener noreferrer">X</a>.
      </p>
      <ul className="mt-10 divide-y divide-line border-y border-line">
        {posts.map((p) => (
          <li key={p.slug}>
            <a href={withBase(`/blog/${p.slug}`)} className="grid gap-2 py-6 hover:bg-panel md:grid-cols-[140px_1fr] md:px-3">
              <span className="font-mono text-xs text-mut">
                {fmtDate(p.date)}
                <Country value={p.country} className="mt-1 flex font-sans text-[11px] text-soft" />
              </span>
              <div>
                <h2 className="text-xl font-semibold tracking-tight"><Txt>{p.title}</Txt></h2>
                <p className="mt-1 text-sm text-soft"><Txt>{p.summary}</Txt></p>
                <div className="mt-3 flex gap-1.5">{p.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
