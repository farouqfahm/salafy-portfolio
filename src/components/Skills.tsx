import type { SkillGroup } from "@/lib/content";
import { Section } from "./ui";
import Bi from "./Bi";
import Reveal from "./Reveal";

/* Bordered card grid; each category card holds its skills as chips. */
export default function Skills({ items }: { items: SkillGroup[] }) {
  if (!items.length) return null;
  return (
    <Section id="skills" title={<Bi k="skills.title" />} sub={<Bi k="skills.sub" />}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((g) => (
          <Reveal key={g.slug} className="card-hover flex flex-col rounded-xl border border-line bg-panel p-5">
            <h3 className="text-sm font-semibold tracking-tight">
              <Bi en={g.category} ar={g.categoryAr || g.category} />
            </h3>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {g.items.map((it) => (
                <span key={it} className="inline-flex items-center rounded-md border border-line bg-card px-2.5 py-1 text-xs text-soft">
                  {it}
                </span>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
