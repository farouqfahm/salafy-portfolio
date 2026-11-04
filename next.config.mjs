/** @type {import('next').NextConfig} */

// When BUILD_TARGET=aws, produce a fully static export for the Kiro Crew
// artifact-deploy contract: served by a shared CloudFront distribution under a
// sub-path (/salafy/). Static export has no Node server, so there are no
// rewrites and images must be unoptimized. The default config (dev + a normal
// `next build`) is unchanged, so `npm run dev` and `npm run build` keep working.
const isAws = process.env.BUILD_TARGET === "aws";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const awsConfig = {
  output: "export",
  // basePath must not have a trailing slash; "" means no base path.
  ...(basePath ? { basePath } : {}),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // No rewrites in a static export (Decap admin is served as static files).
};

const defaultConfig = {
  // Serve the Decap CMS app at /admin and /admin/
  async rewrites() {
    return [
      { source: "/admin", destination: "/admin/index.html" },
      { source: "/admin/", destination: "/admin/index.html" },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

const nextConfig = isAws ? awsConfig : defaultConfig;

export default nextConfig;
