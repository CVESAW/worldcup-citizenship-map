/**
 * Normalizes the country names Transfermarkt returns into the canonical names
 * used throughout the app (and by `lib/countries.ts` for flag/map lookup).
 *
 * TM uses a handful of names that differ from our canonical labels
 * (e.g. "Cote d'Ivoire", "Korea, South", "Türkiye"). Keep this list in one
 * place so both the fetch pipeline and the country-metadata generator agree.
 */

export const CANONICAL_ALIASES: Record<string, string> = {
  "cote d'ivoire": "Ivory Coast",
  "côte d'ivoire": "Ivory Coast",
  "ivory coast": "Ivory Coast",
  "korea, south": "South Korea",
  "south korea": "South Korea",
  "korea, north": "North Korea",
  "north korea": "North Korea",
  "türkiye": "Turkey",
  turkiye: "Turkey",
  turkey: "Turkey",
  "czech republic": "Czech Republic",
  czechia: "Czech Republic",
  usa: "United States",
  "united states": "United States",
  "united states of america": "United States",
  "the gambia": "Gambia",
  gambia: "Gambia",
  "bosnia-herzegovina": "Bosnia and Herzegovina",
  "bosnia and herzegovina": "Bosnia and Herzegovina",
  "republic of ireland": "Ireland",
  ireland: "Ireland",
  uae: "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",
  curacao: "Curaçao",
  "curaçao": "Curaçao",
  "st. kitts & nevis": "Saint Kitts and Nevis",
  "saint kitts and nevis": "Saint Kitts and Nevis",
  "cape verde": "Cape Verde",
  "cabo verde": "Cape Verde",
  "dr congo": "DR Congo",
  "congo dr": "DR Congo",
  "democratic republic of the congo": "DR Congo",
  "the democratic republic of congo": "DR Congo",
  congo: "Congo",
  "republic of the congo": "Congo",
  "north macedonia": "North Macedonia",
  macedonia: "North Macedonia",
  "trinidad and tobago": "Trinidad and Tobago",
  "trinidad & tobago": "Trinidad and Tobago",
  "guinea-bissau": "Guinea-Bissau",
  "guinea bissau": "Guinea-Bissau",
  "equatorial guinea": "Equatorial Guinea",

  // Historical / defunct states Transfermarkt still uses -> modern successor.
  cssr: "Czech Republic",
  udssr: "Russia",
  "soviet union": "Russia",
  zaire: "DR Congo",
  "jugoslawien (sfr)": "Serbia",
  "yugoslavia (republic)": "Serbia",
  yugoslavia: "Serbia",
  "serbia and montenegro": "Serbia",
  "netherlands antilles": "Curaçao",
  "southern sudan": "South Sudan",
  reunion: "France",
  "réunion": "France",
};

/** Map a raw Transfermarkt country name to our canonical display name. */
export function canonicalizeCountry(raw: string): string {
  const key = raw.trim().toLowerCase();
  if (CANONICAL_ALIASES[key]) return CANONICAL_ALIASES[key];
  // Default: keep the original (trimmed) spelling.
  return raw.trim();
}
