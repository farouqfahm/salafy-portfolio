export const site = {
  name: "Umar Fahm",
  alias: "Salafy",
  role: "Founder & Chief AI Officer, ClimatrixAI",
  positioning: "Climate Intelligence for the Next Billion.",
  tagline:
    "Founder of ClimatrixAI: physics-based, deterministic climate risk scoring from satellite data, with an agentic AI layer on top.",
  email: "founders@climatrixai.com",
  phone: "", // [REPLACE] add a phone number to show it in Contact (e.g. "+234 ...")
  website: "https://climatrixai.com",
  linkedin: "https://linkedin.com/in/farouqfahm/",
  twitter: "https://twitter.com/", // [REPLACE] add your X/Twitter handle URL
  booking: "https://cal.boardy.ai/farouqfahm",
  // Canonical site origin. NEXT_PUBLIC_SITE_URL (env) overrides this for AWS.
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://climatrixai.com",
};

/** Canonical absolute origin (no trailing slash) for metadata / JSON-LD / sitemap. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://climatrixai.com").replace(/\/+$/, "");

// `k` is an i18n key in src/lib/i18n.ts (nav.*). Nav + footer render the
// label through <Bi/> so it switches with the language toggle.
export const nav = [
  { k: "nav.about", href: "#about" },
  { k: "nav.track", href: "#track-record" },
  { k: "nav.awards", href: "#awards" },
  { k: "nav.climatrix", href: "#climatrixai" },
  { k: "nav.projects", href: "#projects" },
  { k: "nav.experience", href: "#experience" },
  { k: "nav.skills", href: "#skills" },
  { k: "nav.credentials", href: "#certifications" },
  { k: "nav.publications", href: "#publications" },
  { k: "nav.blog", href: "#blog" },
  { k: "nav.contact", href: "#contact" },
] as const;

// Footer sitemap (a superset incl. links that are not primary nav).
export const footerLinks = [
  { k: "nav.about", href: "/#about" },
  { k: "nav.track", href: "/#track-record" },
  { k: "nav.awards", href: "/#awards" },
  { k: "nav.climatrix", href: "/#climatrixai" },
  { k: "nav.projects", href: "/#projects" },
  { k: "nav.experience", href: "/#experience" },
  { k: "nav.skills", href: "/#skills" },
  { k: "nav.credentials", href: "/#certifications" },
  { k: "nav.publications", href: "/#publications" },
  { k: "nav.blog", href: "/blog" },
  { k: "nav.contact", href: "/#contact" },
] as const;
