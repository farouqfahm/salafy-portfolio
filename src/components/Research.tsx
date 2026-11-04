import type { ResearchProfile } from "@/lib/content";
import { Panel, Txt } from "./ui";
import Bi from "./Bi";

/* Short "Research" block: the research profile paragraph + the open-to interest
 * line. Also surfaced in the About card (Hero). */
export default function Research({ profile }: { profile: ResearchProfile | null }) {
  if (!profile) return null;
  return (
    <Panel id="research" title={<Bi k="research.title" />} aside={<Bi k="research.sub" />}>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <p className="text-lg leading-relaxed text-soft" data-bi-block>
          <span lang="en" data-lang-en>
            <Txt>{profile.body}</Txt>
          </span>
          <span lang="ar" data-lang-ar dir="rtl">
            {profile.bodyAr || profile.body}
          </span>
        </p>
        <div className="rounded-xl border border-signal/30 bg-signal/5 p-5">
          <p className="label text-signal">
            <Bi en="Open to" ar="منفتح على" />
          </p>
          <p className="mt-2 text-sm leading-relaxed text-soft" data-bi-block>
            <span lang="en" data-lang-en>
              <Txt>{profile.interest}</Txt>
            </span>
            <span lang="ar" data-lang-ar dir="rtl">
              {profile.interestAr || profile.interest}
            </span>
          </p>
        </div>
      </div>
    </Panel>
  );
}
