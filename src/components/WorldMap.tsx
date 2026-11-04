import map from "@/lib/map-dots.json";
import { withBase } from "@/lib/base";
import { Section } from "./ui";
import Bi from "./Bi";
import CountUp from "./CountUp";
import Reveal from "./Reveal";

type MapData = {
  width: number;
  height: number;
  dots: [number, number][];
  centroids: Record<string, [number, number]>;
  n2a: Record<string, string>;
};

const DATA = map as unknown as MapData;

/* Dotted equirectangular world map. Dots near a recognised country's centroid
 * light up in signal green; the recognised flags are listed below. Driven by
 * CMS (getRecognisedCountries) so a new country in admin appears automatically.
 * Build-time data: scripts/build-map.mjs. */
export default function WorldMap({ codes }: { codes: string[] }) {
  const recognised = codes.filter((c) => DATA.centroids[c]);
  const centers = recognised.map((c) => DATA.centroids[c]);
  const R2 = 9 * 9; // highlight radius² in projected units

  const isHot = (x: number, y: number) =>
    centers.some(([cx, cy]) => (x - cx) * (x - cx) + (y - cy) * (y - cy) <= R2);

  return (
    <Section
      id="recognition"
      title={<Bi en="Recognised" ar="معترف به" />}
      accent={<Bi en="worldwide" ar="عالميًا" />}
      sub={
        <span>
          <Bi en="Awards, programmes and partners across" ar="جوائز وبرامج وشركاء عبر" />{" "}
          <CountUp value={codes.length} className="font-semibold text-signal" /> <Bi en="countries." ar="دولة." />
        </span>
      }
    >
      <Reveal className="overflow-hidden rounded-xl2 border border-line bg-panel p-5 md:p-8">
        <svg
          viewBox={`0 0 ${DATA.width} ${DATA.height}`}
          className="h-auto w-full"
          role="img"
          aria-label={`World map highlighting ${codes.length} countries`}
        >
          {DATA.dots.map(([x, y], i) => {
            const hot = isHot(x, y);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={hot ? 1.5 : 1}
                className={hot ? "fill-signal" : "fill-mut"}
                opacity={hot ? 0.95 : 0.3}
              />
            );
          })}
        </svg>

        <div className="mt-6 flex flex-wrap gap-2">
          {recognised.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-card px-2 py-1 text-xs text-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={withBase(`/flags/${c}.svg`)} alt="" width={18} height={12} className="h-3 w-[18px] rounded-[2px] object-cover ring-1 ring-white/10" />
              {c}
            </span>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
