// Copies the MIT-licensed flag SVGs (country-flag-icons) into /public/flags
// and writes the country list used by the admin form. Runs before dev/build.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "node_modules", "country-flag-icons", "3x2");
const dest = path.join(root, "public", "flags");
fs.mkdirSync(dest, { recursive: true });

const codes = [];
for (const f of fs.readdirSync(src)) {
  if (!f.endsWith(".svg")) continue;
  fs.copyFileSync(path.join(src, f), path.join(dest, f));
  codes.push(f.replace(".svg", ""));
}

// Country names for the admin dropdown (2-letter codes only, plus EU)
const names = new Intl.DisplayNames(["en"], { type: "region" });
const map = {};
for (const c of codes.filter((c) => /^[A-Z]{2}$/.test(c))) {
  const n = names.of(c);
  if (n && n !== c) map[n] = c;
}
const list = Object.keys(map).sort((a, b) => a.localeCompare(b));
fs.writeFileSync(path.join(root, "src", "lib", "countries.json"), JSON.stringify(list, null, 0));
// name -> flag code, used to show flags on the site
fs.writeFileSync(path.join(root, "src", "lib", "country-codes.json"), JSON.stringify(map, null, 0));
console.log(`flags: ${codes.length} copied, ${list.length} country names`);
