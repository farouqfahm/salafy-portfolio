import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPosts } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { site, SITE_URL } from "@/lib/site";
import { withBase } from "@/lib/base";
import { Country, Shell, Tag, Txt, fmtDate } from "@/components/ui";
import { JsonLd, blogPostingJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return getBlogPosts().map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getBlogPosts().find((x) => x.slug === slug);
  if (!p) return { title: "Story" };
  const canonical = `/blog/${p.slug}`;
  return {
    title: `${p.title} · ${site.name}`,
    description: p.summary,
    alternates: { canonical },
    openGraph: {
      title: p.title,
      description: p.summary,
      type: "article",
      publishedTime: p.date || undefined,
      url: `${SITE_URL}/blog/${p.slug}`,
      images: p.cover ? [{ url: p.cover, alt: p.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title: p.title, description: p.summary, images: p.cover ? [p.cover] : undefined },
  };
}

export default async function Post({ params }: Props) {
  const { slug } = await params;
  const p = getBlogPosts().find((x) => x.slug === slug);
  if (!p) notFound();
  const url = `${SITE_URL}/blog/${p.slug}`;
  const crumbs = [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Stories", url: `${SITE_URL}/blog` },
    { name: p.title, url },
  ];
  const shareLinkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const shareX = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(p.title)}`;

  return (
    <Shell className="py-14 md:py-20">
      <JsonLd data={blogPostingJsonLd(p)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <article className="mx-auto max-w-2xl">
        <nav aria-label="Breadcrumb" className="text-xs text-mut">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><a href={withBase("/")} className="hover:text-fg">Home</a></li>
            <li aria-hidden>/</li>
            <li><a href={withBase("/blog")} className="hover:text-fg">Stories</a></li>
            <li aria-hidden>/</li>
            <li className="text-soft" aria-current="page"><Txt>{p.title}</Txt></li>
          </ol>
        </nav>
        <div className="mt-8 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={withBase("/media/avatar.jpg")} alt="" className="h-9 w-9 rounded-full border border-line object-cover" />
          <p className="text-sm">
            {site.name} <span className="font-mono text-xs text-mut">· {fmtDate(p.date)}</span>{" "}
            <Country value={p.country} className="ml-1 text-xs text-soft" />
          </p>
        </div>
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight md:text-5xl"><Txt>{p.title}</Txt></h1>
        <div className="mt-4 flex gap-1.5">{p.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
        {p.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover} alt="" className="mt-8 w-full rounded-xl2 border border-line" />
        )}
        <div className="prose-post mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />

        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-6 text-sm">
          {p.linkedin && (
            <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-4 py-2 hover:border-soft">
              Discuss on LinkedIn ↗
            </a>
          )}
          {p.twitter && (
            <a href={p.twitter} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-4 py-2 hover:border-soft">
              Discuss on X ↗
            </a>
          )}
          <span className="text-xs text-mut">Share:</span>
          <a href={shareLinkedIn} target="_blank" rel="noopener noreferrer" className="text-signal hover:underline">LinkedIn</a>
          <a href={shareX} target="_blank" rel="noopener noreferrer" className="text-signal hover:underline">X</a>
        </div>
      </article>
    </Shell>
  );
}
