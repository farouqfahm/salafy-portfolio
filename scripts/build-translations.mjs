#!/usr/bin/env node
// Builds the Arabic dictionary for the whole site.
//
//   node scripts/build-translations.mjs [siteDir]
//
// 1. Collects every visible English string from the exported HTML (siteDir,
//    default deploy/site) plus UI strings that only appear after a click
//    (chat, lead form, filters) from the client components' source.
// 2. Translates only strings that are not yet in content/i18n/ar.json, using
//    Claude on Amazon Bedrock (AWS CLI `bedrock-runtime converse`).
// 3. Writes content/i18n/ar.json (cache, committed and hand-editable) and
//    <siteDir>/i18n/ar.json + public/i18n/ar.json (served to the browser).
//
// No AWS access? It keeps the cached translations and warns; the build never fails.
// Hand fixes: edit content/i18n/ar.json. Entries you change are kept.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { parse } from "node-html-parser";

const ROOT = process.cwd();
const SITE = path.resolve(process.argv[2] || path.join(ROOT, "deploy", "site"));
const CACHE = path.join(ROOT, "content", "i18n", "ar.json");
const MODEL = process.env.TRANSLATE_MODEL_ID || "us.anthropic.claude-haiku-4-5-20251001-v1:0";
const REGION = process.env.TRANSLATE_REGION || process.env.AWS_REGION || "us-east-1";
const BATCH = 60;

const AR = /[\u0600-\u06FF]/;
const SKIP_TAGS = new Set(["script", "style", "noscript", "code", "pre", "svg", "template"]);
const ATTRS = ["alt", "title", "placeholder", "aria-label"];

export const norm = (s) => s.replace(/\s+/g, " ").trim();

function worth(s) {
  if (!s || s.length < 2 || s.length > 1500) return false;
  if (!/[A-Za-z]{2}/.test(s)) return false; // numbers, symbols, dates like 2026-11-03
  if (AR.test(s)) return false;
  if (/^(https?:|mailto:|tel:|www\.)/i.test(s)) return false;
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(s)) return false; // email
  if (/^[\w-]+\.(svg|png|jpe?g|webp|mp4|md|json|xml|ya?ml)$/i.test(s)) return false;
  return true;
}

// ---------- 1a. strings from exported HTML ----------
function walk(node, out) {
  if (node.nodeType === 3) {
    const t = norm(node.rawText ? decode(node.rawText) : "");
    if (worth(t)) out.add(t);
    return;
  }
  if (node.nodeType !== 1) {
    for (const c of node.childNodes || []) walk(c, out);
    return;
  }
  const tag = (node.rawTagName || "").toLowerCase();
  if (SKIP_TAGS.has(tag)) return;
  if (node.hasAttribute?.("data-lang-en") || node.hasAttribute?.("data-no-translate")) return;
  for (const a of ATTRS) {
    const v = node.getAttribute?.(a);
    if (v && worth(norm(v))) out.add(norm(v));
  }
  if (tag === "meta") {
    const n = (node.getAttribute("name") || node.getAttribute("property") || "").toLowerCase();
    const c = node.getAttribute("content");
    if (c && ["description", "og:title", "og:description"].includes(n) && worth(norm(c))) out.add(norm(c));
  }
  for (const c of node.childNodes || []) walk(c, out);
}

function decode(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function htmlFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "_next" || e.name === "admin") continue;
      out.push(...htmlFiles(p));
    } else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

// ---------- 1b. strings that only render after a click ----------
const CLIENT_SOURCES = [
  "src/components/LeadAgent.tsx",
  "src/components/Assistant.tsx",
  "src/components/Projects.tsx",
  "src/components/Socials.tsx",
  "src/components/Gallery.tsx",
  "src/components/ProductShowcase.tsx",
  "src/components/LangPrompt.tsx",
  "src/lib/leads.ts",
];

function sourceStrings(out) {
  for (const rel of CLIENT_SOURCES) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, "utf8");
    // JSX text between tags
    for (const m of src.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)) {
      const t = norm(decode(m[1]));
      if (worth(t) && /[A-Za-z]{3}/.test(t)) out.add(t);
    }
    // String literals that read like sentences or labels (not class names / paths)
    for (const m of src.matchAll(/"((?:[^"\\\n]|\\.){2,300})"/g)) {
      const t = norm(m[1].replace(/\\"/g, '"'));
      if (!/^[A-Z“"'(¿]/.test(t)) continue; // UI text starts upper-case; classes don't
      if (/[{}<>`]|\$\{|^[A-Z_]+$/.test(t)) continue; // code, constants
      if (/^(GET|POST|PUT|DELETE|Content-Type|Escape|Enter)$/.test(t)) continue;
      if (worth(t)) out.add(t);
    }
  }
}

// ---------- 2. translate ----------
const SYSTEM = `You translate website text from English to Modern Standard Arabic for the personal site of Umar Fahm (Salafy), founder of ClimatrixAI, a climate intelligence startup.
Rules:
- Return ONLY a JSON array of strings, the same length and order as the input array.
- Natural, professional Arabic suitable for investors, governments and press.
- Keep in Latin script exactly as written: people's names (Umar Fahm, Salafy, Umar), organisation and company names (ClimatrixAI, UNICEF, INSEAD, Qualcomm, NVIDIA, Axelera AI, NIGCOMSAT, EU D4D Hub, SatNav Africa, University of Cambridge, Al-Hikmah University, MIRG-ICAIR, IAENG, Harvard SEAS, NASA ARSET, McKinsey.org, GitHub, LinkedIn, X), product names (FloodSentinel, DrainSentinel DS-01, Hydrosentinel 1.0, Ardis), programming languages and tools, URLs, emails, code and units.
- Keep the exact token [REPLACE] untouched if present.
- Keep numbers as Western digits and keep punctuation like ↗ → · unchanged.
- Month abbreviations like "Oct 2026" become Arabic month names with the year.
- Do not add explanations, quotes or notes.`;

function converse(texts) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tr-"));
  const msgFile = path.join(tmp, "messages.json");
  const sysFile = path.join(tmp, "system.json");
  try {
    fs.writeFileSync(msgFile, JSON.stringify([{ role: "user", content: [{ text: JSON.stringify(texts) }] }]));
    fs.writeFileSync(sysFile, JSON.stringify([{ text: SYSTEM }]));
    const args = [
      "bedrock-runtime", "converse",
      "--model-id", MODEL,
      "--region", REGION,
      "--system", `file://${sysFile}`,
      "--messages", `file://${msgFile}`,
      "--inference-config", JSON.stringify({ maxTokens: 8000, temperature: 0 }),
      "--output", "json",
    ];
    const raw = execFileSync("aws", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, timeout: 180000 });
    const text = JSON.parse(raw).output.message.content.map((c) => c.text || "").join("");
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    const arr = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(arr) || arr.length !== texts.length) throw new Error(`got ${arr.length} for ${texts.length}`);
    return arr.map(String);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function translateAll(todo, dict) {
  let done = 0;
  for (let i = 0; i < todo.length; i += BATCH) {
    const chunk = todo.slice(i, i + BATCH);
    let out;
    try {
      out = converse(chunk);
    } catch (e) {
      // Retry one by one so a single bad item doesn't block the rest
      console.warn(`translate batch failed (${String(e.message).slice(0, 160)}); retrying singly`);
      out = chunk.map((t) => {
        try {
          return converse([t])[0];
        } catch {
          return null;
        }
      });
    }
    chunk.forEach((t, j) => {
      if (out[j] && AR.test(out[j])) {
        dict[t] = out[j];
        done++;
      }
    });
    console.log(`translated ${Math.min(i + BATCH, todo.length)}/${todo.length}`);
  }
  return done;
}

function hasAws() {
  try {
    execFileSync("aws", ["sts", "get-caller-identity", "--region", REGION, "--output", "json"], { stdio: "ignore", timeout: 20000 });
    return true;
  } catch {
    return false;
  }
}

// ---------- main ----------
function main() {
  const found = new Set();
  for (const f of htmlFiles(SITE)) walk(parse(fs.readFileSync(f, "utf8"), { comment: false }), found);
  sourceStrings(found);

  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
  const todo = [...found].filter((t) => !cache[t]).sort();
  console.log(`i18n: ${found.size} strings, ${found.size - todo.length} cached, ${todo.length} new`);

  if (todo.length) {
    if (hasAws()) {
      const n = translateAll(todo, cache);
      console.log(`i18n: translated ${n} new strings with ${MODEL}`);
    } else {
      console.warn("i18n: no AWS access; new strings stay in English until the next build with AWS access.");
    }
  }

  // Keep the cache sorted and complete (old entries kept: they may come back).
  const sorted = Object.fromEntries(Object.keys(cache).sort().map((k) => [k, cache[k]]));
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(sorted, null, 1) + "\n");

  // Ship only what the site uses now.
  const live = Object.fromEntries([...found].filter((k) => cache[k]).map((k) => [k, cache[k]]));
  for (const dir of [path.join(SITE, "i18n"), path.join(ROOT, "public", "i18n")]) {
    if (dir.startsWith(SITE) && !fs.existsSync(SITE)) continue;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "ar.json"), JSON.stringify(live));
  }
  const missing = found.size - Object.keys(live).length;
  if (process.env.I18N_DEBUG) console.log("untranslated:", [...found].filter((k) => !cache[k]).join(" | "));
  console.log(`i18n: shipped ${Object.keys(live).length} translations${missing ? `, ${missing} still English` : ""}`);
}

main();
