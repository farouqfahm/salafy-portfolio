import type { Metadata } from "next";
import { Inter, JetBrains_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import LazyAssistant from "@/components/LazyAssistant";
import { site, SITE_URL } from "@/lib/site";
import { withBase } from "@/lib/base";
import { PRE_PAINT_SCRIPT } from "@/lib/i18n";
import { JsonLd, organizationJsonLd, personJsonLd } from "@/lib/seo";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${site.name} (${site.alias}) · ${site.role}`,
  description: `${site.positioning} ${site.tagline}`,
  alternates: { canonical: "/", types: { "application/rss+xml": withBase("/rss.xml") } },
  openGraph: {
    title: `${site.name} · ClimatrixAI`,
    description: site.positioning,
    type: "website",
    url: SITE_URL,
    images: [{ url: withBase("/media/og.jpg"), width: 1200, height: 630, alt: site.name }],
  },
  twitter: { card: "summary_large_image", title: `${site.name} · ClimatrixAI`, description: site.positioning, images: [withBase("/media/og.jpg")] },
  // app/icon.svg + app/apple-icon.png are picked up automatically by Next.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${sans.variable} ${mono.variable} ${arabic.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies saved/detected theme + language before paint (no flash) */}
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
        <JsonLd data={personJsonLd()} />
        <JsonLd data={organizationJsonLd()} />
      </head>
      <body className="font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-fg focus:px-3 focus:py-2 focus:text-ink">
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <LazyAssistant />
      </body>
    </html>
  );
}
