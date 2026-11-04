#!/usr/bin/env node
// Build aws/api/context.json: a compact, structured summary of the site's
// Markdown content (/content/**/*.md) plus the profile basics from
// src/lib/site.ts. The chat Lambda feeds this JSON into the Bedrock system
// prompt so the assistant answers ONLY from real site content.
//
// Design notes:
//  - Reads EVERY folder under /content generically, so new folders the
//    frontend agent adds (content/skills, content/profile, content/recognizers
//    …) are picked up without editing this script.
//  - Parses front matter with gray-matter (already a dependency).
//  - Skips any field value or whole entry that still contains "[REPLACE]"
//    (placeholder content that must never be shown to visitors).
//  - Keeps the output under ~40 KB; folders are trimmed if the budget is hit.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const SITE_TS = path.join(ROOT, "src", "lib", "site.ts");
const OUT = path.join(ROOT, "aws", "api", "context.json");
const MAX_BYTES = 40 * 1024;

const PLACEHOLDER = "[REPLACE]";

function hasPlaceholder(v) {
  if (v == null) return false;
  if (typeof v === "string") return v.includes(PLACEHOLDER);
  if (Array.isArray(v)) return v.some(hasPlaceholder);
  if (typeof v === "object") return Object.values(v).some(hasPlaceholder);
  return false;
}

/** Drop any field whose value contains a placeholder; recurse into arrays/objects. */
function clean(v) {
  if (Array.isArray(v)) {
    const arr = v.map(clean).filter((x) => x !== undefined && !(Array.isArray(x) && x.length === 0));
    return arr;
  }
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (hasPlaceholder(val)) continue;
      const c = clean(val);
      if (c === undefined) continue;
      if (typeof c === "string" && !c.trim()) continue;
      if (Array.isArray(c) && c.length === 0) continue;
      out[k] = c;
    }
    return out;
  }
  if (typeof v === "string") {
    const t = v.trim();
    return t.includes(PLACEHOLDER) ? undefined : t;
  }
  return v;
}

/** Read one Markdown file into a compact record: merged front matter + body. */
function readEntry(file) {
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const body = content.trim();
  const rec = { ...data };
  if (body && !body.includes(PLACEHOLDER)) rec.body = body;
  // Whole-entry placeholder guard: if the TITLE/name/role is a placeholder,
  // skip the entry entirely (it is not real content yet).
  const label = data.title || data.role || data.name || data.org || "";
  if (typeof label === "string" && label.includes(PLACEHOLDER)) return null;
  const cleaned = clean(rec);
  if (!cleaned || Object.keys(cleaned).length === 0) return null;
  return cleaned;
}

function readFolder(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) continue; // content folders are flat; media lives elsewhere
    if (!e.name.endsWith(".md")) continue;
    try {
      const rec = readEntry(path.join(dir, e.name));
      if (rec) out.push({ slug: e.name.replace(/\.md$/, ""), ...rec });
    } catch (err) {
      console.warn(`skip ${e.name}: ${err.message}`);
    }
  }
  // Stable, newest-first where a date exists.
  out.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  return out;
}

/** Extract the simple string fields from src/lib/site.ts without importing TS. */
function readProfile() {
  const profile = {};
  if (!fs.existsSync(SITE_TS)) return profile;
  const text = fs.readFileSync(SITE_TS, "utf8");
  // Match `key: "value",` inside the `site` object.
  const want = [
    "name",
    "alias",
    "role",
    "positioning",
    "tagline",
    "email",
    "website",
    "linkedin",
    "twitter",
    "booking",
  ];
  for (const key of want) {
    const m = text.match(new RegExp(`\\b${key}\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    if (m) {
      const val = m[1].replace(/\\"/g, '"');
      if (!val.includes(PLACEHOLDER)) profile[key] = val;
    }
  }
  return profile;
}

function byteLen(obj) {
  return Buffer.byteLength(JSON.stringify(obj), "utf8");
}

function main() {
  const profile = readProfile();

  const content = {};
  if (fs.existsSync(CONTENT)) {
    const folders = fs
      .readdirSync(CONTENT, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    for (const folder of folders) {
      const recs = readFolder(path.join(CONTENT, folder));
      if (recs.length) content[folder] = recs;
    }
  }

  const doc = {
    generatedAt: new Date().toISOString(),
    profile,
    content,
  };

  // Budget: if we exceed ~40 KB, trim bodies first, then drop oldest entries
  // from the largest folders until we fit.
  if (byteLen(doc) > MAX_BYTES) {
    for (const recs of Object.values(doc.content)) {
      for (const r of recs) {
        if (typeof r.body === "string" && r.body.length > 400) {
          r.body = r.body.slice(0, 400).trimEnd() + "…";
        }
      }
    }
  }
  while (byteLen(doc) > MAX_BYTES) {
    // Find the largest folder and drop its last (oldest) entry.
    let biggest = null;
    let biggestLen = 0;
    for (const [folder, recs] of Object.entries(doc.content)) {
      const l = byteLen(recs);
      if (l > biggestLen && recs.length > 1) {
        biggestLen = l;
        biggest = folder;
      }
    }
    if (!biggest) break;
    doc.content[biggest].pop();
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2) + "\n", "utf8");
  const kb = (byteLen(doc) / 1024).toFixed(1);
  const folders = Object.keys(doc.content).length;
  const total = Object.values(doc.content).reduce((n, r) => n + r.length, 0);
  console.log(`wrote ${OUT} (${kb} KB, ${folders} folders, ${total} entries)`);
}

main();
