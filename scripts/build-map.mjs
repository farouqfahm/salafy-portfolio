// Precompute a dotted world map at build time, so the site ships no mapping
// libraries to the browser. Output: src/lib/map-dots.json with
//   { width, height, dots:[[x,y],...], centroids:{ XX:[x,y] }, n2a:{ "566":"NG" } }
// where x/y are already projected into a WIDTH x HEIGHT equirectangular box.
//
// Data: world-atlas@2.0.2 (countries-110m, ISO numeric ids) + topojson-client
// + d3-geo. Dev-only dependencies; nothing here runs in the browser.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const topo = require("world-atlas/countries-110m.json");
const { feature } = require("topojson-client");
const { geoContains, geoCentroid } = require("d3-geo");
const names = require("../src/lib/country-codes.json");

const OUT = path.join(process.cwd(), "src/lib/map-dots.json");

// world-atlas uses abbreviated names; map them onto our name->alpha2 table.
const NAME_FIX = {
  "United States of America": "United States",
  "Dem. Rep. Congo": "Congo - Kinshasa",
  "Congo": "Congo - Brazzaville",
  "Central African Rep.": "Central African Republic",
  "S. Sudan": "South Sudan",
  "W. Sahara": "Western Sahara",
  "Dominican Rep.": "Dominican Republic",
  "Falkland Is.": "Falkland Islands",
  "Fr. S. Antarctic Lands": "French Southern Territories",
  "Bosnia and Herz.": "Bosnia & Herzegovina",
  "Macedonia": "North Macedonia",
  "Czechia": "Czechia",
  "Côte d'Ivoire": "Côte d’Ivoire",
  "Korea": "South Korea",
  "Dem. Rep. Korea": "North Korea",
  "Solomon Is.": "Solomon Islands",
  "Eq. Guinea": "Equatorial Guinea",
  "eSwatini": "Eswatini",
  "Timor-Leste": "Timor-Leste",
  "Myanmar": "Myanmar (Burma)",
  "Taiwan": "Taiwan",
  "Palestine": "Palestinian Territories",
  "Brunei": "Brunei",
  "Lao PDR": "Laos",
  "Dem. Rep.": "",
};

function alpha2(name) {
  const n = NAME_FIX[name] ?? name;
  if (!n) return null;
  return names[n] || null;
}

function main() {
  const fc = feature(topo, topo.objects.countries);

  const WIDTH = 440;
  const HEIGHT = 220;
  // equirectangular: lon -180..180 -> 0..WIDTH, lat 90..-90 -> 0..HEIGHT
  const project = (lon, lat) => [((lon + 180) / 360) * WIDTH, ((90 - lat) / 180) * HEIGHT];

  const n2a = {};
  const centroids = {};
  for (const f of fc.features) {
    const code = alpha2(f.properties && f.properties.name);
    if (code) {
      n2a[String(f.id)] = code;
      const c = geoCentroid(f);
      if (Number.isFinite(c[0]) && Number.isFinite(c[1])) {
        const [x, y] = project(c[0], c[1]);
        centroids[code] = [Math.round(x), Math.round(y)];
      }
    }
  }

  // Sample a lon/lat grid; keep a dot where it falls on any country polygon.
  const dots = [];
  const STEP = 2.2; // degrees
  for (let lat = 83; lat >= -56; lat -= STEP) {
    for (let lon = -180; lon <= 180; lon += STEP) {
      let hit = false;
      for (const f of fc.features) {
        if (geoContains(f, [lon, lat])) {
          hit = true;
          break;
        }
      }
      if (hit) {
        const [x, y] = project(lon, lat);
        dots.push([Math.round(x), Math.round(y)]);
      }
    }
  }

  const out = { width: WIDTH, height: HEIGHT, dots, centroids, n2a };
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(`[build-map] ${dots.length} dots, ${Object.keys(centroids).length} centroids -> ${path.relative(process.cwd(), OUT)}`);
}

main();
