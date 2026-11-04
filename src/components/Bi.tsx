import type { ReactNode } from "react";
import * as React from "react";
import { DICT } from "@/lib/i18n";
import { isPlaceholder } from "./ui";

/*
 * Bilingual text. Renders BOTH languages into the HTML; globals.css hides the
 * inactive one via html[data-lang]. Server component — no client JS.
 *
 *   <Bi k="hero.badge" />              // from the UI dictionary
 *   <Bi en="Hello" ar="مرحبا" />       // ad-hoc / content front-matter
 *   <Bi en={title} ar={titleAr} />     // ar optional; falls back to en
 *
 * A [REPLACE] placeholder keeps the Txt amber highlight.
 */

function Placeholderify({ text }: { text: string }) {
  if (isPlaceholder(text)) {
    return (
      <span className="rounded bg-amber/10 px-1 text-amber outline outline-1 outline-amber/30">{text}</span>
    );
  }
  return <>{text}</>;
}

export function Bi({
  k,
  en,
  ar,
  as: Tag = "span",
  className = "",
}: {
  k?: string;
  en?: string;
  ar?: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}): ReactNode {
  let enText = en ?? "";
  let arText = ar ?? "";
  if (k && DICT[k]) {
    enText = DICT[k].en;
    arText = DICT[k].ar;
  }
  // When no Arabic is supplied, show English in both slots (so it still renders
  // in Arabic mode rather than disappearing).
  const arFinal = arText || enText;
  return (
    <Tag className={className} data-bi="">
      <span lang="en" data-lang-en>
        <Placeholderify text={enText} />
      </span>
      <span lang="ar" data-lang-ar dir="rtl">
        <Placeholderify text={arFinal} />
      </span>
    </Tag>
  );
}

export default Bi;
