import type { Showcase } from "@/lib/content";
import ProductShowcase from "./ProductShowcase";
import OpenAgentButton from "./OpenAgentButton";
import { Panel } from "./ui";
import Bi from "./Bi";
import { site } from "@/lib/site";

const pillars = [
  { t: "Satellite data in", d: "Earth observation and open climate data, per location." },
  { t: "Physics engine", d: "Stated rules turn that data into a risk score. Same input, same output." },
  { t: "Agentic AI layer", d: "Agents explain the score and answer questions in plain language." },
];

const compare = [
  { k: "How a score is made", bb: "Learned weights, hidden", px: "Physical rules, written down" },
  { k: "Same input twice", bb: "Can drift between versions", px: "Same answer every time" },
  { k: "Data-scarce places", bb: "Weak without training labels", px: "Works from physics and satellites" },
  { k: "Can you audit it?", bb: "Hard to explain", px: "Every factor is visible" },
];

export default function Climatrix({ showcase }: { showcase: Showcase | null }) {
  return (
    <Panel id="climatrixai" title={<Bi k="climatrix.title" />} accent="" aside={site.positioning}>
      {showcase?.show && (showcase.image || showcase.video) && (
        <div className="mb-10">
          <ProductShowcase data={showcase} />
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="text-lg leading-relaxed text-soft">
            ClimatrixAI builds physics-based, deterministic climate risk scoring from satellite data, with an agentic AI
            layer on top.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {pillars.map((p, i) => (
              <div key={p.t} className="rounded-xl border border-line bg-card p-4">
                <span className="font-mono text-[11px] text-signal">0{i + 1}</span>
                <p className="mt-2 text-sm font-semibold">{p.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-mut">{p.d}</p>
              </div>
            ))}
          </div>

        </div>
        <div>
          <p className="label">Physics engine vs black-box ML</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-xs text-mut">
                <tr>
                  <th className="px-4 py-2.5 font-normal" scope="col"></th>
                  <th className="px-4 py-2.5 font-normal" scope="col">Black-box ML</th>
                  <th className="px-4 py-2.5 font-normal text-signal" scope="col">ClimatrixAI</th>
                </tr>
              </thead>
              <tbody>
                {compare.map((c) => (
                  <tr key={c.k} className="border-t border-line">
                    <th scope="row" className="px-4 py-3 text-xs font-normal text-mut">{c.k}</th>
                    <td className="px-4 py-3 text-soft">{c.bb}</td>
                    <td className="px-4 py-3 text-fg">{c.px}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <OpenAgentButton label={<Bi k="btn.requestDemo" />} />
            <a href={showcase?.url || site.website} target="_blank" rel="noopener noreferrer" className="text-sm text-signal hover:underline">
              Visit climatrixai.com ↗
            </a>
          </div>
        </div>
      </div>
    </Panel>
  );
}
