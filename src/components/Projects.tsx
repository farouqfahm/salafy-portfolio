"use client";
import { useState } from "react";
import type { Project } from "@/lib/content";
import { Country, MediaView, Tag, Txt, fmtDate } from "./ui";
import Bi from "./Bi";

type Filter = "All" | "Completed" | "In progress";

function statusOf(p: Project): "Completed" | "In progress" | "Unknown" {
  const v = p.status.toLowerCase();
  if (v.includes("[replace]") || !v) return "Unknown";
  return v.startsWith("complete") ? "Completed" : "In progress";
}

function StatusPill({ p }: { p: Project }) {
  const st = statusOf(p);
  if (st === "Unknown") return <Txt className="font-mono text-[10px]">{p.status || "[REPLACE] status"}</Txt>;
  const done = st === "Completed";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
        done ? "border-line text-soft" : "border-signal/30 bg-signal/10 text-signal"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-soft" : "pulse-dot bg-signal"}`} />
      {st}
    </span>
  );
}

function Card({ p }: { p: Project }) {
  const cover = p.media.find((m) => m.type === "image");
  const video = p.media.find((m) => m.type !== "image");
  const [play, setPlay] = useState(false);
  return (
    <article className="card-hover flex flex-col overflow-hidden rounded-xl border border-line bg-panel">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-card">
        {play && video ? (
          <MediaView m={video} className="h-full" />
        ) : cover ? (
          <MediaView m={cover} />
        ) : video ? (
          <MediaView m={video} className="h-full" />
        ) : (
          <div className="grid h-full place-items-center font-mono text-xs text-mut">No media yet</div>
        )}
        {video && cover && !play && (
          <button
            onClick={() => setPlay(true)}
            className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full btn-primary px-3 py-1.5 text-xs font-medium "
          >
            ▶ Video overview
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <StatusPill p={p} />
          <span className="font-mono text-[11px] text-mut">{fmtDate(p.date)}</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold tracking-tight">
          {p.titleAr ? <Bi en={p.title} ar={p.titleAr} /> : <Txt>{p.title}</Txt>}
        </h3>
        <p className="mt-0.5 text-xs text-mut">
          <Txt>{[p.role, p.org].filter(Boolean).join(" · ")}</Txt>
        </p>
        <Country value={p.country} className="mt-2 text-xs text-soft" />
        <p className="mt-3 text-sm leading-relaxed text-soft">
          {p.summaryAr ? <Bi en={p.summary} ar={p.summaryAr} /> : <Txt>{p.summary}</Txt>}
        </p>
        {p.body && (
          <p className="mt-2 text-xs leading-relaxed text-mut">
            <Txt>{p.body}</Txt>
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          {p.tags.slice(0, 3).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
          {p.links.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-signal hover:underline">
              {l.label} ↗
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function Projects({ items }: { items: Project[] }) {
  const [f, setF] = useState<Filter>("All");
  const count = (x: Filter) => (x === "All" ? items.length : items.filter((p) => statusOf(p) === x).length);
  const shown = f === "All" ? items : items.filter((p) => statusOf(p) === f);
  return (
    <>
      <div className="mb-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter projects">
        {(["All", "In progress", "Completed"] as Filter[]).map((x) => (
          <button
            key={x}
            role="tab"
            aria-selected={f === x}
            onClick={() => setF(x)}
            className={`rounded-full px-4 py-1.5 text-xs ${f === x ? "bg-fg text-ink" : "border border-line text-soft hover:border-soft"}`}
          >
            {x} <span className="opacity-60">{count(x)}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <Card key={p.slug} p={p} />
        ))}
      </div>
      {shown.length === 0 && <p className="text-sm text-mut">Nothing here yet.</p>}
    </>
  );
}
