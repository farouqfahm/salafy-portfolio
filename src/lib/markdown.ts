// Tiny, dependency-free Markdown renderer for blog posts and stories.
// Supports: headings (#, ##, ###), paragraphs, **bold**, *italic*, `code`,
// [links](url), images ![alt](src), unordered (-, *) and ordered (1.) lists, > quotes.
// All text is HTML-escaped first, so content files cannot inject scripts.

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import { withBase } from "./base";

function safeUrl(u: string) {
  const t = u.trim();
  // Root-absolute app links ("/media/...", "/blog") get the base path so they
  // resolve under the deploy sub-path; http(s)/mailto/fragment links are kept.
  if (/^\//.test(t)) return withBase(t);
  if (/^(https?:|mailto:|#)/i.test(t)) return t;
  return "#";
}

function inline(s: string) {
  let out = esc(s);
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt, src) =>
    `<img src="${safeUrl(src)}" alt="${alt}" loading="lazy" />`);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, t, u) =>
    `<a href="${safeUrl(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) html.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) html.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.type}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); flushList(); continue; }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) { flushPara(); flushList(); const n = h[1].length + 1; html.push(`<h${n}>${inline(h[2])}</h${n}>`); continue; }
    const q = line.match(/^>\s?(.*)$/);
    if (q) { flushPara(); flushList(); html.push(`<blockquote>${inline(q[1])}</blockquote>`); continue; }
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul || ol) {
      flushPara();
      const type = ul ? "ul" : "ol";
      if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
      list.items.push((ul || ol)![1]);
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();
  return html.join("\n");
}
