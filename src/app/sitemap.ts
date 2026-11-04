import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/content";
import { SITE_URL } from "@/lib/site";
import { BASE_PATH } from "@/lib/base";

// force-static so it works with `output: export` on AWS.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `${SITE_URL}${BASE_PATH}`;
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];
  for (const p of getBlogPosts()) {
    routes.push({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.date ? new Date(p.date) : now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }
  return routes;
}
