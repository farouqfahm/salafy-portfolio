// JSON-LD builders. Pure data (no secrets); rendered in a <script type="application/ld+json">.
import { SITE_URL, site } from "./site";
import { getAchievements, getAwards, getSkills, type BlogPost } from "./content";

export function personJsonLd() {
  const awards = [...getAchievements(), ...getAwards()]
    .map((a) => a.title)
    .filter((t) => t && !t.includes("[REPLACE]"))
    .slice(0, 30);
  const knowsAbout = getSkills().flatMap((g) => g.items).slice(0, 24);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Umar Fahm",
    alternateName: "Salafy",
    jobTitle: "Founder & Chief AI Officer",
    worksFor: { "@type": "Organization", name: "ClimatrixAI", url: site.website },
    alumniOf: { "@type": "CollegeOrUniversity", name: "Al-Hikmah University, Ilorin" },
    award: awards,
    knowsAbout,
    url: SITE_URL,
    sameAs: [site.linkedin, site.twitter].filter((u) => u && !u.endsWith("twitter.com/")),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ClimatrixAI",
    url: site.website,
    description: site.positioning,
    founder: { "@type": "Person", name: "Umar Fahm" },
  };
}

export function blogPostingJsonLd(p: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    datePublished: p.date,
    dateModified: p.date,
    author: { "@type": "Person", name: "Umar Fahm" },
    image: p.cover ? `${SITE_URL}${p.cover}` : undefined,
    mainEntityOfPage: `${SITE_URL}/blog/${p.slug}`,
    description: p.summary,
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** Render JSON-LD as a <script> string-safe object. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
