// Build-time: render the SVG mark into app/apple-icon.png (180px) with sharp.
// Next.js serves src/app/apple-icon.png as the Apple touch icon automatically.
// Skips silently if sharp is unavailable.
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "src/app/apple-icon.png");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="40" fill="#0a0a0b"/>
  <ellipse cx="90" cy="90" rx="66" ry="34" transform="rotate(-28 90 90)" stroke="#8a8a92" stroke-width="7" fill="none" opacity="0.6"/>
  <circle cx="140" cy="56" r="12" fill="#34d399"/>
  <g fill="#ededed">
    <path d="M48 62v31c0 9 6.2 14.6 15.6 14.6S79.2 102 79.2 93V62h-9.6v30.5c0 4.4-2.4 7.2-6 7.2s-6-2.8-6-7.2V62H48z"/>
    <path d="M98 62v45h9.6V89.8h15.6v-8.4H107.6V70h17.2v-8H98z"/>
  </g>
</svg>`;

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.log("[build-icons] sharp unavailable, skipping apple-icon.png");
    return;
  }
  await sharp(Buffer.from(svg)).resize(180, 180).png().toFile(OUT);
  console.log("[build-icons] wrote", path.relative(process.cwd(), OUT));

  // Pre-optimise key photos to WebP at sensible sizes for faster first paint.
  const webp = [
    { src: "public/media/portrait.jpg", out: "public/media/portrait.webp", width: 900 },
    { src: "public/media/avatar.jpg", out: "public/media/avatar.webp", width: 160 },
  ];
  for (const w of webp) {
    const srcPath = path.join(process.cwd(), w.src);
    if (!fs.existsSync(srcPath)) continue;
    try {
      await sharp(srcPath).resize({ width: w.width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(process.cwd(), w.out));
      console.log("[build-icons] wrote", w.out);
    } catch (e) {
      console.log("[build-icons] webp skip", w.out, e.message);
    }
  }
}

main().catch((e) => {
  console.error("[build-icons] failed:", e.message);
  process.exit(0); // non-fatal
});
