import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { BASE_PATH } from "@/lib/base";

// force-static so it works with `output: export` on AWS.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const base = `${SITE_URL}${BASE_PATH}`;
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin" }],
    sitemap: `${base}/sitemap.xml`,
    host: SITE_URL,
  };
}
