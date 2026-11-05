"use client";
import { useEffect } from "react";
import { withBase } from "@/lib/base";

/*
 * Whole-page Arabic. The build makes /i18n/ar.json (English text -> Arabic) from
 * every string on the site, CMS content included. When Arabic is on, this swaps
 * every text node and label in place, and keeps doing so for anything that
 * appears later (chat, filters, "show more"). Switching back restores English.
 */

const AR = /[\u0600-\u06FF]/;
const ATTRS = ["alt", "title", "placeholder", "aria-label"] as const;
const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT", "svg"]);

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

let dict: Record<string, string> | null = null;
let loading: Promise<Record<string, string>> | null = null;
const origText = new WeakMap<Text, string>();
const origAttr = new WeakMap<Element, Record<string, string>>();
const touched = new Set<WeakRef<Node>>();
let observer: MutationObserver | null = null;
let origTitle = "";

function load() {
  if (dict) return Promise.resolve(dict);
  loading ??= fetch(withBase("/i18n/ar.json"))
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((d) => (dict = d as Record<string, string>));
  return loading;
}

function skipped(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP.has(e.tagName) || e.hasAttribute("data-no-translate") || e.hasAttribute("data-lang-en")) return true;
    if ((e as HTMLElement).isContentEditable) return true;
  }
  return false;
}

function doText(t: Text, d: Record<string, string>) {
  const raw = origText.get(t) ?? t.data;
  const key = norm(raw);
  if (!key || AR.test(key)) return;
  const ar = d[key];
  if (!ar) return;
  if (!origText.has(t)) {
    origText.set(t, raw);
    touched.add(new WeakRef(t));
  }
  const lead = raw.match(/^\s*/)![0];
  const tail = raw.match(/\s*$/)![0];
  const next = lead + ar + tail;
  if (t.data !== next) t.data = next;
}

function doAttrs(el: Element, d: Record<string, string>) {
  for (const a of ATTRS) {
    const saved = origAttr.get(el)?.[a];
    const v = saved ?? el.getAttribute(a);
    if (!v) continue;
    const ar = d[norm(v)];
    if (!ar) continue;
    if (saved === undefined) {
      origAttr.set(el, { ...(origAttr.get(el) || {}), [a]: v });
      touched.add(new WeakRef(el));
    }
    if (el.getAttribute(a) !== ar) el.setAttribute(a, ar);
  }
}

function apply(root: Node, d: Record<string, string>) {
  if (root.nodeType === 3) {
    if (!skipped((root as Text).parentElement)) doText(root as Text, d);
    return;
  }
  if (root.nodeType !== 1 && root.nodeType !== 9) return;
  const start = root.nodeType === 9 ? (root as Document).body : (root as Element);
  if (!start || skipped(start)) return;
  const w = document.createTreeWalker(start, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (n.nodeType === 1) {
        const e = n as Element;
        if (SKIP.has(e.tagName) || e.hasAttribute("data-no-translate") || e.hasAttribute("data-lang-en"))
          return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  doAttrs(start, d);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (n.nodeType === 3) doText(n as Text, d);
    else doAttrs(n as Element, d);
  }
}

function restore() {
  observer?.disconnect();
  observer = null;
  for (const ref of touched) {
    const n = ref.deref();
    if (!n) continue;
    if (n.nodeType === 3) {
      const o = origText.get(n as Text);
      if (o !== undefined) (n as Text).data = o;
    } else {
      const o = origAttr.get(n as Element);
      if (o) for (const [k, v] of Object.entries(o)) (n as Element).setAttribute(k, v);
    }
  }
  if (origTitle) document.title = origTitle;
}

async function toArabic() {
  const d = await load();
  if (document.documentElement.getAttribute("data-lang") !== "ar") return;
  apply(document, d);
  if (!origTitle) origTitle = document.title;
  const tt = d[norm(origTitle)];
  if (tt) document.title = tt;
  observer?.disconnect();
  observer = new MutationObserver((muts) => {
    observer?.disconnect();
    for (const m of muts) {
      if (m.type === "characterData") {
        const t = m.target as Text;
        // Text changed by React: forget the old original so the new English is kept
        if (!AR.test(t.data)) origText.delete(t);
        apply(t, d);
      } else if (m.type === "attributes") {
        const el = m.target as Element;
        const v = el.getAttribute(m.attributeName!);
        if (v && !AR.test(v)) {
          const o = origAttr.get(el);
          if (o) delete o[m.attributeName!];
        }
        if (!skipped(el)) doAttrs(el, d);
      } else m.addedNodes.forEach((n) => apply(n, d));
    }
    observe();
  });
  observe();
}

function observe() {
  observer?.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS],
  });
}

function ready() {
  document.documentElement.setAttribute("data-i18n", "ready");
}

export function setLang(lang: "en" | "ar") {
  const d = document.documentElement;
  d.setAttribute("data-lang", lang);
  d.setAttribute("lang", lang);
  d.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  try {
    localStorage.setItem("lang", lang);
  } catch {}
  window.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
}

export default function Translator() {
  useEffect(() => {
    const run = () => {
      if (document.documentElement.getAttribute("data-lang") === "ar") toArabic().finally(ready);
      else {
        restore();
        ready();
      }
    };
    run();
    window.addEventListener("langchange", run);
    return () => window.removeEventListener("langchange", run);
  }, []);
  return null;
}
