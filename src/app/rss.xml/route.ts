import { Feed } from "feed";
import { getUpdates } from "@/lib/content";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const feed = new Feed({
    title: `${site.name} · Updates`,
    description: "Running log from Umar Fahm (Salafy), founder of ClimatrixAI.",
    id: site.url,
    link: `${site.url}/#updates`,
    language: "en",
    copyright: `© ${new Date().getFullYear()} ${site.name}`,
    author: { name: site.name, email: site.email, link: site.url },
  });

  for (const u of getUpdates()) {
    const first = u.text.split(/\n/)[0].slice(0, 90);
    feed.addItem({
      title: `[${u.tag}] ${first}`,
      id: `${site.url}/#update-${u.slug}`,
      link: u.links[0]?.url || `${site.url}/#updates`,
      description: u.text,
      date: new Date(u.date + "T00:00:00Z"),
    });
  }

  return new Response(feed.rss2(), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
