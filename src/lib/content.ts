import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { withBase } from "./base";
import { resolveCountries } from "./country";

const CONTENT_DIR = path.join(process.cwd(), "content");

/** The admin writes dates unquoted (date: 2026-09-15), which YAML turns into a
 *  Date object. Turn every Date back into "YYYY-MM-DD" so sorting never breaks. */
function plainDates(v: any): any {
  if (v instanceof Date) return isNaN(v.getTime()) ? "" : v.toISOString().slice(0, 10);
  if (Array.isArray(v)) return v.map(plainDates);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plainDates(x)]));
  return v;
}

/** Prefix a content-sourced local media path ("/media/...") with the base path.
 *  Image/video ids and external URLs (http, https) are left untouched. */
function media(src?: string): string {
  return withBase(src);
}

export type Media = {
  type: "image" | "video" | "youtube" | "vimeo";
  src: string; // image path, or video url / embed id
  alt?: string;
  poster?: string;
  fit?: "cover" | "contain"; // "contain" = show whole image (logos) on a light tile
};

export type LinkRef = { label: string; url: string };

export type Achievement = {
  slug: string;
  country: string; // where it was achieved, e.g. "Nigeria"
  title: string;
  titleAr: string; // optional Arabic title (title_ar)
  date: string; // ISO
  location?: string;
  lat?: number;
  lng?: number;
  org: string; // who gave / ran it
  level: string; // Winner, Top 10, Cohort...
  featured: boolean; // shows in the hero "Selected by" strip
  brand: string; // short name for that strip, e.g. "UNICEF"
  tags: string[];
  metrics: { label: string; value: string }[];
  media: Media[];
  links: LinkRef[];
  body: string; // one-paragraph story
};

export type Update = {
  slug: string;
  country: string; // where it was achieved, e.g. "Nigeria"
  date: string;
  tag: string;
  text: string;
  textAr: string;
  media: Media[];
  links: LinkRef[];
};

export type Project = {
  slug: string;
  country: string; // where it was achieved, e.g. "Nigeria"
  title: string;
  titleAr: string;
  date?: string;
  status: string; // "Completed" | "In progress"
  pinned: boolean; // pinned projects show first
  role?: string;
  org?: string;
  summary: string;
  summaryAr: string;
  tags: string[];
  media: Media[];
  links: LinkRef[];
  body: string;
};

export type Proof = {
  slug: string;
  country: string; // where it was achieved, e.g. "Nigeria"
  title: string;
  kind: string; // Award | Grant | Program | Pilot | Certification | Press | Partner
  org?: string;
  date?: string;
  url?: string;
  logo?: string;
  note?: string;
};

export type Education = {
  slug: string;
  country: string; // where it was achieved, e.g. "Nigeria"
  title: string;
  org: string;
  date?: string;
  kind: string; // Degree | Course | Certification | Exam
  detail?: string;
  url?: string;
  thesis?: string;
  supervisor?: string;
};

export type BlogPost = {
  slug: string;
  country: string; // where it was achieved, e.g. "Nigeria"
  title: string;
  titleAr: string;
  date: string;
  tags: string[];
  summary: string;
  summaryAr: string;
  cover?: string;
  linkedin?: string;
  twitter?: string;
  body: string;
};

function readDir(sub: string): { slug: string; data: any; content: string }[] {
  const dir = path.join(CONTENT_DIR, sub);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data, content } = matter(raw);
      return { slug: f.replace(/\.mdx?$/, ""), data: plainDates(data), content: content.trim() };
    });
}

function byDateDesc(a: { date?: string }, b: { date?: string }) {
  return (b.date || "").localeCompare(a.date || "");
}

const norm = {
  media: (m: any[]): Media[] => (Array.isArray(m) ? m : []).map((x) => {
    const type = x.type || "image";
    // image/video src is a local path -> base-prefix it; youtube/vimeo src is a
    // bare video id (never starts with "/") so withBase leaves it untouched.
    return {
      type,
      src: media(x.src || ""),
      alt: x.alt || "",
      poster: media(x.poster || ""),
      fit: x.fit === "contain" ? "contain" : "cover",
    };
  }),
  links: (l: any[]): LinkRef[] => (Array.isArray(l) ? l : []).map((x) => ({
    label: x.label || x.url,
    url: x.url,
  })),
  tags: (t: any): string[] => (Array.isArray(t) ? t : t ? [t] : []),
};

export function getAchievements(): Achievement[] {
  return readDir("achievements")
    .map(({ slug, data, content }) => ({
      slug,
      country: data.country ? String(data.country) : "",
      title: data.title || slug,
      titleAr: data.title_ar ? String(data.title_ar) : "",
      date: data.date || "",
      location: data.location || "",
      lat: typeof data.lat === "number" ? data.lat : undefined,
      lng: typeof data.lng === "number" ? data.lng : undefined,
      org: data.org ? String(data.org) : "",
      level: data.level ? String(data.level) : "",
      featured: data.featured === true,
      brand: data.brand ? String(data.brand) : "",
      tags: norm.tags(data.tags),
      metrics: Array.isArray(data.metrics) ? data.metrics : [],
      media: norm.media(data.media),
      links: norm.links(data.links),
      body: content,
    }))
    .sort(byDateDesc);
}

export function getUpdates(): Update[] {
  return readDir("updates")
    .map(({ slug, data, content }) => ({
      slug,
      country: data.country ? String(data.country) : "",
      date: data.date || "",
      tag: data.tag || "LOG",
      text: content || data.text || "",
      textAr: data.text_ar ? String(data.text_ar) : "",
      media: norm.media(data.media),
      links: norm.links(data.links),
    }))
    .sort(byDateDesc);
}

export function getProjects(): Project[] {
  return readDir("projects")
    .map(({ slug, data, content }) => ({
      slug,
      country: data.country ? String(data.country) : "",
      title: data.title || slug,
      titleAr: data.title_ar ? String(data.title_ar) : "",
      status: data.status ? String(data.status) : "",
      pinned: data.pinned === true,
      date: data.date || "",
      role: data.role || "",
      org: data.org || "",
      summary: data.summary || "",
      summaryAr: data.summary_ar ? String(data.summary_ar) : "",
      tags: norm.tags(data.tags),
      media: norm.media(data.media),
      links: norm.links(data.links),
      body: content,
    }))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || byDateDesc(a, b));
}

export function getProof(): Proof[] {
  return readDir("proof")
    .map(({ slug, data, content }) => ({
      slug,
      country: data.country ? String(data.country) : "",
      title: data.title || slug,
      kind: data.kind || "Proof",
      org: data.org || "",
      date: data.date || "",
      url: data.url || "",
      logo: media(data.logo || ""),
      note: data.note || content || "",
    }))
    .sort(byDateDesc);
}

export function getEducation(): Education[] {
  return readDir("education")
    .map(({ slug, data, content }) => ({
      slug,
      country: data.country ? String(data.country) : "",
      title: data.title || slug,
      org: data.org || "",
      date: data.date || "",
      kind: data.kind || "Education",
      detail: data.detail || content || "",
      url: data.url || "",
      thesis: data.thesis ? String(data.thesis) : "",
      supervisor: data.supervisor ? String(data.supervisor) : "",
    }))
    .sort(byDateDesc);
}

export function getBlogPosts(): BlogPost[] {
  return readDir("blog")
    .map(({ slug, data, content }) => ({
      slug,
      country: data.country ? String(data.country) : "",
      title: data.title || slug,
      titleAr: data.title_ar ? String(data.title_ar) : "",
      date: data.date || "",
      tags: norm.tags(data.tags),
      summary: data.summary || "",
      summaryAr: data.summary_ar ? String(data.summary_ar) : "",
      cover: media(data.cover || ""),
      linkedin: data.linkedin || "",
      twitter: data.twitter || "",
      body: content,
    }))
    .sort(byDateDesc);
}

/* ---------- New sections ---------- */
export type Experience = {
  slug: string; country: string; role: string; org: string; start: string; end: string;
  location: string; url: string; logo: string; highlights: string[];
};

/** Pull a 4-digit year out of a free-form date like "Jan 2025" / "Summer 2024". */
function yearOf(v: string): number {
  const m = v.match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : 0;
}
export type Certification = {
  slug: string; country: string; title: string; org: string; kind: string; date: string; credentialId: string; url: string;
};
export type Award = {
  slug: string; country: string; title: string; titleAr: string; org: string; date: string; level: string; url: string; image: string; imageFit?: string; note: string; featured?: boolean;
};
export type Testimonial = {
  slug: string; country: string; name: string; role: string; org: string; photo: string; url: string; quote: string;
};
export type Publication = {
  slug: string; country: string; title: string; venue: string; date: string; type: string; authors: string; url: string;
  note: string; status: string;
};
export type Membership = { slug: string; country: string; org: string; role: string; since: string; url: string; logo: string };
export type SocialPost = { slug: string; country: string; platform: "linkedin" | "x"; date: string; url: string; text: string };

const s = (v: unknown) => (v == null ? "" : String(v));

export function getExperience(): Experience[] {
  return readDir("experience")
    .map(({ slug, data }) => ({
      slug,
      country: data.country ? String(data.country) : "", role: s(data.role), org: s(data.org), start: s(data.start), end: s(data.end),
      location: s(data.location), url: s(data.url), logo: media(s(data.logo)),
      highlights: Array.isArray(data.highlights) ? data.highlights.map(s) : [],
    }))
    // "Present" roles first, then by start year (parsed, so "Summer 2024" sorts under "Aug 2025")
    .sort((a, b) => Number(b.end === "Present") - Number(a.end === "Present") || yearOf(b.start) - yearOf(a.start));
}

export function getCertifications(): Certification[] {
  return readDir("certifications")
    .map(({ slug, data }) => ({
      slug,
      country: data.country ? String(data.country) : "", title: s(data.title), org: s(data.org), kind: s(data.kind) || "Certification",
      date: s(data.date), credentialId: s(data.credential_id), url: s(data.url),
    }))
    .sort(byDateDesc);
}

export function getAwards(): Award[] {
  return readDir("awards")
    .map(({ slug, data, content }) => ({
      slug,
      country: data.country ? String(data.country) : "", title: s(data.title), titleAr: s(data.title_ar), org: s(data.org), date: s(data.date), level: s(data.level),
      url: s(data.url), image: media(s(data.image)), imageFit: s(data.image_fit) || "cover", note: content,
    }))
    .sort(byDateDesc);
}

export function getTestimonials(): Testimonial[] {
  return readDir("testimonials").map(({ slug, data, content }) => ({
    slug,
      country: data.country ? String(data.country) : "", name: s(data.name), role: s(data.role), org: s(data.org),
    photo: media(s(data.photo)), url: s(data.url), quote: content,
  }));
}

export function getPublications(): Publication[] {
  return readDir("publications")
    .map(({ slug, data }) => ({
      slug,
      country: data.country ? String(data.country) : "", title: s(data.title), venue: s(data.venue), date: s(data.date),
      type: s(data.type) || "Publication", authors: s(data.authors), url: s(data.url),
      note: s(data.note), status: s(data.status),
    }))
    .sort(byDateDesc);
}

export function getMemberships(): Membership[] {
  return readDir("memberships").map(({ slug, data }) => ({
    slug,
      country: data.country ? String(data.country) : "", org: s(data.org), role: s(data.role), since: s(data.since), url: s(data.url), logo: media(s(data.logo)),
  }));
}

export function getSocialPosts(): SocialPost[] {
  return readDir("social")
    .map(({ slug, data, content }) => ({
      slug,
      country: data.country ? String(data.country) : "",
      platform: (s(data.platform).toLowerCase() === "linkedin" ? "linkedin" : "x") as "linkedin" | "x",
      date: s(data.date), url: s(data.url).trim(), text: s(data.text) || content,
    }))
    .sort(byDateDesc);
}

export function getMediaItems(): Media[] {
  // Gallery pulls from a dedicated media folder plus any achievement media
  const dedicated = readDir("media").flatMap(({ data }) => norm.media(data.items || data.media));
  return dedicated;
}

/* ---------- Skills ---------- */
export type SkillGroup = { slug: string; category: string; categoryAr: string; order: number; items: string[] };

export function getSkills(): SkillGroup[] {
  return readDir("skills")
    .map(({ slug, data }) => ({
      slug,
      category: s(data.category) || slug,
      categoryAr: s(data.category_ar),
      order: typeof data.order === "number" ? data.order : 99,
      items: Array.isArray(data.items) ? data.items.map(s).filter(Boolean) : [],
    }))
    .sort((a, b) => a.order - b.order || a.category.localeCompare(b.category));
}

/* ---------- Recognizers (hero "Recognized by" logo row) ---------- */
export type Recognizer = { slug: string; name: string; logo: string; url: string; order: number; show: boolean };

export function getRecognizers(): Recognizer[] {
  return readDir("recognizers")
    .map(({ slug, data }) => ({
      slug,
      name: s(data.name) || slug,
      logo: media(s(data.logo)),
      url: s(data.url),
      order: typeof data.order === "number" ? data.order : 99,
      show: data.show !== false,
    }))
    .filter((r) => r.show && r.logo)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/* ---------- Research profile (single file) ---------- */
export type ResearchProfile = {
  title: string; titleAr: string; body: string; bodyAr: string; interest: string; interestAr: string;
};

export function getResearchProfile(): ResearchProfile | null {
  const entries = readDir("profile");
  const r = entries.find((e) => e.slug === "research") || entries[0];
  if (!r) return null;
  const d = r.data;
  return {
    title: s(d.title) || "Research profile",
    titleAr: s(d.title_ar),
    body: s(d.body) || r.content,
    bodyAr: s(d.body_ar),
    interest: s(d.interest),
    interestAr: s(d.interest_ar),
  };
}

/* ---------- Recognised-in-N-countries counter ---------- */
/** Dedupe countries across achievements + awards + proof + memberships + certifications. */
export function getRecognisedCountries(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (v?: string) => {
    for (const p of resolveCountries(v)) {
      const key = (p.code || p.label).toUpperCase();
      if (p.region) continue; // skip "Global"/"Africa" regions from the country count
      if (!seen.has(key)) {
        seen.add(key);
        out.push(key);
      }
    }
  };
  getAchievements().forEach((a) => add(a.country));
  getAwards().forEach((a) => add(a.country));
  getProof().forEach((p) => add(p.country));
  getMemberships().forEach((m) => add(m.country));
  getCertifications().forEach((c) => add(c.country));
  return out; // ISO alpha-2 codes (upper) for dots/flags
}

/* ---------- Product showcase (MacBook mockup in the ClimatrixAI section) ---------- */
export type Hotspot = { x: number; y: number; label: string; labelAr: string };
export type Showcase = {
  show: boolean;
  product: string;
  url: string;
  image: string; // screenshot shown on the laptop screen
  alt: string;
  video: string; // optional self-hosted mp4/webm; replaces the image when set
  captions: { en: string; ar: string }[];
  hotspots: Hotspot[];
  motion: boolean; // slow pan + live overlays
};

export function getShowcase(): Showcase | null {
  const r = readDir("showcase").find((e) => e.slug === "climatrixai");
  if (!r) return null;
  const d = r.data;
  const num = (v: unknown, lo: number, hi: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;
  };
  return {
    show: d.show !== false,
    product: s(d.product) || "FloodSentinel",
    url: s(d.url),
    image: media(s(d.image)),
    alt: s(d.alt) || "Product screenshot",
    video: media(s(d.video)),
    captions: (Array.isArray(d.captions) ? d.captions : [])
      .map((c: any) => ({ en: s(c?.text), ar: s(c?.text_ar) }))
      .filter((c: { en: string }) => c.en),
    hotspots: (Array.isArray(d.hotspots) ? d.hotspots : [])
      .map((h: any) => ({ x: num(h?.x, 0, 100), y: num(h?.y, 0, 100), label: s(h?.label), labelAr: s(h?.label_ar) }))
      .filter((h: Hotspot) => h.label),
    motion: d.motion !== false,
  };
}
