// Country name -> ISO code, so typing "Nigeria" (or "UK", "USA", "Cabo Verde") shows the right flag.
// Works for every country Intl knows; aliases cover common spellings.

const REGIONS = new Set(["global", "worldwide", "online", "virtual", "africa", "pan-africa", "pan-african", "west africa"]);

const ALIASES: Record<string, string> = {
  uk: "GB", "great britain": "GB", britain: "GB", england: "GB-ENG", scotland: "GB-SCT", wales: "GB-WLS",
  usa: "US", "u.s.": "US", "u.s.a.": "US", america: "US", "united states of america": "US",
  uae: "AE", emirates: "AE", "cabo verde": "CV", "ivory coast": "CI", "cote d'ivoire": "CI",
  drc: "CD", "dr congo": "CD", "democratic republic of the congo": "CD", "republic of the congo": "CG",
  turkey: "TR", "south korea": "KR", korea: "KR", "north korea": "KP", russia: "RU", "czech republic": "CZ",
  "european union": "EU", eu: "EU", europe: "EU", holland: "NL", "the netherlands": "NL", swaziland: "SZ",
  "hong kong": "HK", taiwan: "TW", palestine: "PS", "the gambia": "GM", gambia: "GM", vietnam: "VN",
};

import CODES from "./country-codes.json";

// name (lowercase) -> code, built only from countries that have a flag file
const byName = new Map<string, string>(
  Object.entries(CODES as Record<string, string>).map(([n, c]) => [n.toLowerCase().replace(/’/g, "'"), c]),
);
const known = new Set(Object.values(CODES as Record<string, string>));

export type Place = { code: string | null; region: boolean; label: string };

/** Resolve the first country in a value like "Nigeria" or "Lagos, Nigeria". */
export function resolveCountry(value?: string): Place | null {
  const v = (value || "").trim();
  if (!v || v.includes("[REPLACE]")) return null;
  const key = v.toLowerCase().replace(/’/g, "'");
  if (REGIONS.has(key)) return { code: null, region: true, label: v };
  if (ALIASES[key]) return { code: ALIASES[key], region: false, label: v };
  if (/^[A-Za-z]{2}$/.test(v) && known.has(v.toUpperCase())) return { code: v.toUpperCase(), region: false, label: v.toUpperCase() };
  const code = byName.get(key) || null;
  return { code, region: false, label: v };
}

/** Accepts "Nigeria" or "Nigeria, United Kingdom" (several countries). */
export function resolveCountries(value?: string): Place[] {
  return (value || "")
    .split(/\s*[,;/]\s*|\s+&\s+/)
    .map((p) => resolveCountry(p))
    .filter((p): p is Place => !!p);
}
