/**
 * Country registry.
 *
 * Maps our canonical country names (the labels used in the data and shown to
 * users, e.g. "England", "Ivory Coast") to:
 *   - `iso2`: ISO 3166-1 alpha-2 code, used to derive a flag emoji.
 *   - `geo`:  the name used by the world-atlas topojson in `public/world-110m.json`
 *             (`properties.name`), used to highlight the matching shape on the map.
 *             Only present when it differs from the canonical name.
 *   - `flag`: an explicit flag emoji override (for sub-national teams such as
 *             England/Scotland that have no ISO2 code of their own).
 *
 * Countries without a `geo` entry that don't match a topojson shape simply
 * won't highlight on the map — they still appear everywhere else (cards,
 * badges, search). This is intentional and handled gracefully.
 */

import { GENERATED_COUNTRY_META } from "./countries.generated";

export interface CountryMeta {
  iso2: string;
  /** Topojson `properties.name`, when different from the canonical name. */
  geo?: string;
  /** Explicit flag emoji override. */
  flag?: string;
}

/**
 * Hand-curated entries. These take precedence over the generated map — they
 * carry the nice sub-national flag emojis (England/Scotland/…) and verified
 * geo-name mappings.
 */
const MANUAL_COUNTRY_META: Record<string, CountryMeta> = {
  // UK home nations -> their own shapes (drawn from public/uk-nations.json).
  England: { iso2: "GB", geo: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  Scotland: { iso2: "GB", geo: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  Wales: { iso2: "GB", geo: "Wales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  "Northern Ireland": { iso2: "GB", geo: "Northern Ireland", flag: "🇬🇧" },

  // Names that differ from the topojson label.
  "United States": { iso2: "US", geo: "United States of America" },
  USA: { iso2: "US", geo: "United States of America" },
  "Ivory Coast": { iso2: "CI", geo: "Côte d'Ivoire" },
  "Côte d'Ivoire": { iso2: "CI" },
  "DR Congo": { iso2: "CD", geo: "Dem. Rep. Congo" },
  "Democratic Republic of the Congo": { iso2: "CD", geo: "Dem. Rep. Congo" },
  "Republic of the Congo": { iso2: "CG", geo: "Congo" },
  Congo: { iso2: "CG" },
  "Equatorial Guinea": { iso2: "GQ", geo: "Eq. Guinea" },
  "Bosnia and Herzegovina": { iso2: "BA", geo: "Bosnia and Herz." },
  "Czech Republic": { iso2: "CZ", geo: "Czechia" },
  Czechia: { iso2: "CZ" },
  "North Macedonia": { iso2: "MK", geo: "Macedonia" },
  "South Korea": { iso2: "KR" },
  "North Korea": { iso2: "KP" },
  "Cape Verde": { iso2: "CV", geo: "Cabo Verde" },
  "Trinidad and Tobago": { iso2: "TT" },
  "Central African Republic": { iso2: "CF", geo: "Central African Rep." },
  "Dominican Republic": { iso2: "DO", geo: "Dominican Rep." },
  "South Sudan": { iso2: "SS", geo: "S. Sudan" },

  // 1:1 names (canonical name === topojson name).
  Nigeria: { iso2: "NG" },
  Ireland: { iso2: "IE" },
  Brazil: { iso2: "BR" },
  France: { iso2: "FR" },
  Lebanon: { iso2: "LB" },
  Italy: { iso2: "IT" },
  Germany: { iso2: "DE" },
  Ghana: { iso2: "GH" },
  Spain: { iso2: "ES" },
  Norway: { iso2: "NO" },
  Belgium: { iso2: "BE" },
  Portugal: { iso2: "PT" },
  Croatia: { iso2: "HR" },
  Cameroon: { iso2: "CM" },
  Algeria: { iso2: "DZ" },
  "Sierra Leone": { iso2: "SL" },
  Angola: { iso2: "AO" },
  Poland: { iso2: "PL" },
  Morocco: { iso2: "MA" },
  Netherlands: { iso2: "NL" },
  Benin: { iso2: "BJ" },
  Liberia: { iso2: "LR" },
  "Guinea-Bissau": { iso2: "GW" },
  Senegal: { iso2: "SN" },
  Mali: { iso2: "ML" },
  Egypt: { iso2: "EG" },
  Suriname: { iso2: "SR" },
  Togo: { iso2: "TG" },
  Denmark: { iso2: "DK" },
  "Saint Kitts and Nevis": { iso2: "KN" },
  Argentina: { iso2: "AR" },
  Ecuador: { iso2: "EC" },
  Gambia: { iso2: "GM" },
  Serbia: { iso2: "RS" },
  Uruguay: { iso2: "UY" },
  Colombia: { iso2: "CO" },

  // Extra common football nations, for future data.
  Mexico: { iso2: "MX" },
  Canada: { iso2: "CA" },
  Japan: { iso2: "JP" },
  Australia: { iso2: "AU" },
  Switzerland: { iso2: "CH" },
  Austria: { iso2: "AT" },
  Sweden: { iso2: "SE" },
  Turkey: { iso2: "TR" },
  Greece: { iso2: "GR" },
  Russia: { iso2: "RU" },
  Ukraine: { iso2: "UA" },
  Tunisia: { iso2: "TN" },
  "South Africa": { iso2: "ZA" },
  Chile: { iso2: "CL" },
  Peru: { iso2: "PE" },
  Paraguay: { iso2: "PY" },
  "Costa Rica": { iso2: "CR" },
  Jamaica: { iso2: "JM" },
  Guinea: { iso2: "GN" },
  Mauritania: { iso2: "MR" },
  Kosovo: { iso2: "XK" },
  Albania: { iso2: "AL" },
  Hungary: { iso2: "HU" },
  Romania: { iso2: "RO" },
  Finland: { iso2: "FI" },
  Iceland: { iso2: "IS" },
  "Saudi Arabia": { iso2: "SA" },
  Iran: { iso2: "IR" },
  Qatar: { iso2: "QA" },
  Kenya: { iso2: "KE" },
};

/**
 * Full registry: the auto-generated map (covers every country present in the
 * dataset, produced by `scripts/build_countries.ts`) merged under the curated
 * manual entries, which win on conflict.
 */
export const COUNTRY_META: Record<string, CountryMeta> = {
  ...GENERATED_COUNTRY_META,
  ...MANUAL_COUNTRY_META,
};

/** Convert an ISO 3166-1 alpha-2 code into a flag emoji. */
function iso2ToEmoji(iso2: string): string {
  if (iso2.length !== 2) return "🏳️";
  const codePoints = iso2
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}

/** Flag emoji for a canonical country name (falls back to a neutral flag). */
export function countryFlag(country: string): string {
  const meta = COUNTRY_META[country];
  if (!meta) return "🏳️";
  return meta.flag ?? iso2ToEmoji(meta.iso2);
}

/** ISO2 code for a canonical country name (empty string if unknown). */
export function countryIso2(country: string): string {
  return COUNTRY_META[country]?.iso2 ?? "";
}

/** Topojson shape name for a canonical country name. */
export function countryToGeoName(country: string): string {
  const meta = COUNTRY_META[country];
  if (!meta) return country;
  return meta.geo ?? country;
}

/**
 * Reverse index: topojson shape name -> canonical country names that map to it.
 * (e.g. "United Kingdom" -> ["England", "Scotland", "Wales", ...]).
 */
const GEO_TO_COUNTRIES: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = {};
  for (const name of Object.keys(COUNTRY_META)) {
    const geo = countryToGeoName(name);
    (out[geo] ??= []).push(name);
  }
  return out;
})();

export function geoNameToCountries(geoName: string): string[] {
  return GEO_TO_COUNTRIES[geoName] ?? [geoName];
}
