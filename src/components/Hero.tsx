import { site } from "@/lib/site";
import type { ResearchProfile } from "@/lib/content";
import { Shell, Txt } from "./ui";
import Bi from "./Bi";
import CountUp from "./CountUp";
import { withBase } from "@/lib/base";
import { DICT } from "@/lib/i18n";

type Props = {
  stats: { awards: number; programmes: number; countries: number };
  research: ResearchProfile | null;
};

export default function Hero({ stats, research }: Props) {
  return (
    <>
      <section id="top" className="hero-grain relative overflow-hidden border-b border-line">
        <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden />
        {/* Portrait fades into the hero */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withBase("/media/portrait.jpg")}
          alt=""
          aria-hidden
          fetchPriority="high"
          width={760}
          height={1000}
          className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[34%] object-cover object-[50%_15%] opacity-60 lg:block"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, black 50%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 50%)",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" aria-hidden />
        <Shell className="relative pb-16 pt-16 md:pb-24 md:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3 py-1 text-xs text-soft">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-signal" />
            <Bi k="hero.badge" />
          </span>
          <h1 className="mt-6 max-w-4xl text-[44px] font-semibold leading-[0.98] tracking-[-0.03em] sm:text-6xl md:text-[84px]">
            <Bi k="hero.h1a" />
            <br />
            <Bi k="hero.h1b" /> <span className="text-mut"><Bi k="hero.h1c" /></span>
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-soft md:text-base">{site.tagline}</p>
          <div className="mt-8">
            <a href={site.booking} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium">
              <Bi k="btn.bookUmar" /> <span aria-hidden>→</span>
            </a>
          </div>
        </Shell>
      </section>

      {/* About card */}
      <section id="about" className="scroll-mt-24 py-10 md:py-14">
        <Shell>
          <div className="grid overflow-hidden rounded-xl2 border border-line bg-panel md:grid-cols-[1fr_1.3fr_0.8fr]">
            <div className="flex flex-col justify-between gap-8 border-b border-line p-6 md:border-b-0 md:border-r md:p-8">
              <div>
                <p className="text-xs text-mut"><Bi k="about.role" /></p>
                <p className="mt-1 text-xl font-semibold">ClimatrixAI</p>
                <p className="mt-2 text-sm text-mut"><Bi k="about.loc" /></p>
              </div>
              <p className="text-[15px] leading-relaxed text-soft" data-bi-block>
                <span lang="en" data-lang-en>{DICT["about.body"].en}</span>
                <span lang="ar" data-lang-ar dir="rtl">{DICT["about.body"].ar}</span>
              </p>
              {research?.interest && (
                <p className="rounded-lg border border-signal/25 bg-signal/5 p-3 text-xs leading-relaxed text-soft" data-bi-block>
                  <span lang="en" data-lang-en><Txt>{research.interest}</Txt></span>
                  <span lang="ar" data-lang-ar dir="rtl">{research.interestAr || research.interest}</span>
                </p>
              )}
              <a href="#contact" className="w-fit rounded-full border border-line px-4 py-2 text-sm hover:border-soft">
                <Bi k="btn.getInTouch" />
              </a>
            </div>
            <div className="relative min-h-[320px] border-b border-line md:border-b-0 md:border-r">
              <picture>
                <source srcSet={withBase("/media/portrait.webp")} type="image/webp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={withBase("/media/portrait.jpg")}
                  alt="Umar Fahm wearing a ClimatrixAI cap and shirt"
                  width={760}
                  height={1000}
                  fetchPriority="high"
                  className="absolute inset-0 h-full w-full object-cover object-[50%_20%]"
                />
              </picture>
            </div>
            <div className="grid grid-rows-4">
              {[
                { v: stats.awards, l: "hero.statAwards" },
                { v: stats.programmes, l: "hero.statProgrammes" },
                { v: stats.countries, l: "hero.statCountries" },
                { v: 1, l: "hero.statPatent" },
              ].map((s, i) => (
                <div key={s.l} className={`p-6 md:p-8 ${i < 3 ? "border-b border-line" : ""}`}>
                  <p className="text-4xl font-semibold tracking-tight"><CountUp value={s.v} /></p>
                  <p className="mt-2 text-sm text-mut"><Bi k={s.l} /></p>
                </div>
              ))}
            </div>
          </div>
        </Shell>
      </section>
    </>
  );
}
