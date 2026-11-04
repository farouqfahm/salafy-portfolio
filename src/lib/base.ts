// Base-path helper for deploying the site under a sub-path (e.g. the Kiro Crew
// shared CloudFront distribution serves this app at /salafy/).
//
// NEXT_PUBLIC_BASE_PATH is "" in normal dev/prod (so every URL stays
// root-absolute as before) and "/salafy" for the AWS static export. It is
// inlined into both the server and client bundles by Next, so withBase() gives
// the same result everywhere.
//
// Only root-absolute app URLs ("/media/...", "/flags/XX.svg", "/blog",
// "/rss.xml", "/admin/", "/#section", "/api/leads") must be wrapped. Full URLs
// (https://, mailto:), bare fragments ("#x") and relative paths are returned
// unchanged.

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a root-absolute app URL with the base path. No-op when BASE_PATH is "". */
export function withBase(href: string | undefined | null): string {
  const h = href ?? "";
  if (!BASE_PATH) return h;
  // Only rewrite paths that start with a single "/" (root-absolute). Leave
  // protocol-relative ("//"), absolute URLs, mailto:, tel:, data:, and bare
  // fragments/relative paths untouched.
  if (!h.startsWith("/") || h.startsWith("//")) return h;
  // Avoid double-prefixing if a value already carries the base path.
  if (h === BASE_PATH || h.startsWith(BASE_PATH + "/")) return h;
  return BASE_PATH + h;
}
