/**
 * Transfermarkt fetch pipeline — builds the full World Cup 2026 dataset.
 *
 * Strategy (Transfermarkt has no official API; national-team squads aren't
 * exposed by the community REST wrapper, but player profiles are):
 *
 *   1. Resolve each of the 48 nations to its Transfermarkt "verein" id via the
 *      community API's club search.
 *   2. Fetch the national-team page directly and extract the squad's player ids
 *      (the `startseite/verein/{id}` page lists exactly the current squad).
 *   3. Enrich each player via the community API's `/players/{id}/profile`
 *      endpoint, which returns the full citizenship array, birth country, club,
 *      position and image.
 *
 * Everything is cached to `.tm-cache/` and the run is fully resumable — re-run
 * after an interruption and it skips anything already fetched.
 *
 * Usage:
 *   npx tsx scripts/fetch_transfermarkt.ts resolve   # print nation -> id table
 *   npx tsx scripts/fetch_transfermarkt.ts           # full fetch -> data/players.generated.json
 *
 * Env:
 *   TM_API_BASE      community API base (default https://transfermarkt-api.fly.dev)
 *   TM_CONCURRENCY   parallel requests (default 5)
 */

import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { canonicalizeCountry } from "../lib/data/country-normalize";

const API = process.env.TM_API_BASE ?? "https://transfermarkt-api.fly.dev";
const SITE = "https://www.transfermarkt.com";
const CONCURRENCY = Number(process.env.TM_CONCURRENCY ?? 5);
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const CACHE = resolvePath(process.cwd(), ".tm-cache");
const SQUAD_CACHE = resolvePath(CACHE, "squads");
const PROFILE_CACHE = resolvePath(CACHE, "profiles");
const ID_CACHE = resolvePath(CACHE, "nation-ids.json");
const OUT = resolvePath(process.cwd(), "data", "players.generated.json");

for (const dir of [CACHE, SQUAD_CACHE, PROFILE_CACHE, resolvePath(process.cwd(), "data")]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/** 48 nations qualified for the 2026 FIFA World Cup. */
const NATIONS = [
  "Argentina", "Australia", "Austria", "Belgium", "Bosnia and Herzegovina",
  "Brazil", "Canada", "Cape Verde", "Colombia", "Croatia", "Curaçao",
  "Czech Republic", "DR Congo", "Ecuador", "Egypt", "England", "France",
  "Germany", "Ghana", "Haiti", "Iran", "Iraq", "Ivory Coast", "Japan",
  "Jordan", "Mexico", "Morocco", "Netherlands", "New Zealand", "Norway",
  "Panama", "Paraguay", "Portugal", "Qatar", "Saudi Arabia", "Scotland",
  "Senegal", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland",
  "Tunisia", "Turkey", "United States", "Uruguay", "Uzbekistan", "Algeria",
];

const YOUTH_OR_WOMEN = /\b(U-?\d{2}|Olympic|Women|Frauen|Futsal|Beach|B-Team|U23|U21|U20|U19|U18|U17)\b/i;

/**
 * Explicit Transfermarkt verein ids for nations whose name doesn't reliably
 * surface in club search (verified senior national-team ids). These take
 * precedence over search resolution.
 */
const ID_OVERRIDES: Record<string, { id: string; url: string }> = {
  "South Korea": { id: "3589", url: "/x/startseite/verein/3589" },
  Uzbekistan: { id: "3563", url: "/x/startseite/verein/3563" },
  Algeria: { id: "3614", url: "/x/startseite/verein/3614" },
};

/** Search terms for nations whose Transfermarkt spelling differs. */
const SEARCH_OVERRIDES: Record<string, string> = {
  "Bosnia and Herzegovina": "Bosnia-Herzegovina",
  "Ivory Coast": "Cote d'Ivoire",
  Turkey: "Türkiye",
  "South Korea": "Korea, South",
  Curaçao: "Curacao",
};

function norm(s: string): string {
  return canonicalizeCountry(s).toLowerCase();
}

async function fetchText(url: string, opts: RequestInit = {}, tries = 6): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(url, {
        ...opts,
        headers: { "User-Agent": UA, Accept: "application/json,text/html", ...(opts.headers ?? {}) },
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 404) throw Object.assign(new Error("404"), { permanent: true });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      // The community API occasionally returns an empty body under load — retry.
      if (!text.trim()) throw new Error("empty body");
      return text;
    } catch (err) {
      lastErr = err;
      if ((err as { permanent?: boolean }).permanent) throw err;
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  throw lastErr;
}

async function fetchJson<T>(url: string, tries = 4): Promise<T> {
  return JSON.parse(await fetchText(url, {}, tries)) as T;
}

// ---- Step 1: resolve nation -> Transfermarkt id ---------------------------

interface ClubSearchResult {
  id: string;
  url: string;
  name: string;
  country: string;
  squad?: number;
}

async function resolveNationId(nation: string): Promise<{ id: string; url: string } | null> {
  const term = SEARCH_OVERRIDES[nation] ?? nation;
  const data = await fetchJson<{ results: ClubSearchResult[] }>(
    `${API}/clubs/search/${encodeURIComponent(term)}`
  );
  const candidates = (data.results ?? []).filter((r) => !YOUTH_OR_WOMEN.test(r.name));
  // A senior national team uniquely has name === nation (clubs from that
  // country share the country field but never the exact national name).
  const matches = candidates.filter((r) => norm(r.name) === norm(nation));
  // Among name matches, prefer the one whose country also equals the nation.
  const pick =
    matches.find((r) => norm(r.country) === norm(nation)) ?? matches[0];
  return pick ? { id: pick.id, url: pick.url } : null;
}

async function resolveAllIds(): Promise<Record<string, { id: string; url: string }>> {
  const cached: Record<string, { id: string; url: string }> = existsSync(ID_CACHE)
    ? JSON.parse(readFileSync(ID_CACHE, "utf8"))
    : {};
  for (const nation of NATIONS) {
    if (cached[nation]) continue;
    if (ID_OVERRIDES[nation]) {
      cached[nation] = ID_OVERRIDES[nation];
      console.log(`  ✓ ${nation.padEnd(24)} -> ${cached[nation].id}  (override)`);
      writeFileSync(ID_CACHE, JSON.stringify(cached, null, 2));
      continue;
    }
    try {
      const r = await resolveNationId(nation);
      if (r) {
        cached[nation] = r;
        console.log(`  ✓ ${nation.padEnd(24)} -> ${r.id}  (${r.url})`);
      } else {
        console.warn(`  ✖ ${nation}: no national-team result`);
      }
    } catch (e) {
      console.warn(`  ✖ ${nation}: ${(e as Error).message}`);
    }
    writeFileSync(ID_CACHE, JSON.stringify(cached, null, 2));
  }
  return cached;
}

// ---- Step 2: squad player ids from the national-team page -----------------

async function getSquadPlayerIds(nation: string, url: string): Promise<string[]> {
  const cacheFile = resolvePath(SQUAD_CACHE, `${nation}.json`);
  if (existsSync(cacheFile)) return JSON.parse(readFileSync(cacheFile, "utf8"));

  const html = await fetchText(`${SITE}${url}`);
  const ids = [...html.matchAll(/\/profil\/spieler\/(\d+)/g)].map((m) => m[1]);
  const unique = [...new Set(ids)];
  writeFileSync(cacheFile, JSON.stringify(unique));
  return unique;
}

// ---- Step 3: enrich player profiles ---------------------------------------

interface TmProfile {
  name: string;
  citizenship?: string[];
  placeOfBirth?: { country?: string | null } | null;
  position?: { main?: string } | null;
  club?: { name?: string } | null;
  imageUrl?: string | null;
  marketValue?: number | null;
}

async function getProfile(playerId: string): Promise<TmProfile | null> {
  const cacheFile = resolvePath(PROFILE_CACHE, `${playerId}.json`);
  if (existsSync(cacheFile)) return JSON.parse(readFileSync(cacheFile, "utf8"));
  try {
    const p = await fetchJson<TmProfile>(`${API}/players/${playerId}/profile`);
    writeFileSync(cacheFile, JSON.stringify(p));
    return p;
  } catch (e) {
    console.warn(`    ✖ profile ${playerId}: ${(e as Error).message}`);
    return null;
  }
}

/** Minimal promise pool. */
async function pool<T, R>(items: T[], size: number, worker: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      out[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, run));
  return out;
}

interface OutPlayer {
  name: string;
  represented_country: string;
  birth_country: string;
  club: string;
  position: string;
  image_url: string | null;
  market_value: number | null;
  citizenships: string[];
}

function buildPlayer(nation: string, p: TmProfile): OutPlayer {
  const represented = canonicalizeCountry(nation);
  const citizenships = (p.citizenship ?? []).map(canonicalizeCountry).filter(Boolean);
  // Ensure the represented nation is present (so country-mode always finds the squad).
  if (!citizenships.some((c) => c.toLowerCase() === represented.toLowerCase())) {
    citizenships.unshift(represented);
  }
  const birth = p.placeOfBirth?.country ? canonicalizeCountry(p.placeOfBirth.country) : represented;
  return {
    name: p.name,
    represented_country: represented,
    birth_country: birth,
    club: p.club?.name?.trim() || "—",
    position: p.position?.main?.trim() || "",
    image_url: p.imageUrl || null,
    market_value: typeof p.marketValue === "number" ? p.marketValue : null,
    citizenships: [...new Set(citizenships)],
  };
}

async function main() {
  const mode = process.argv[2];

  console.log("→ Resolving nation Transfermarkt ids…");
  const ids = await resolveAllIds();
  console.log(`  resolved ${Object.keys(ids).length}/${NATIONS.length} nations\n`);

  if (mode === "resolve") return;

  const all: OutPlayer[] = [];
  for (const nation of NATIONS) {
    const ref = ids[nation];
    if (!ref) {
      console.warn(`! Skipping ${nation} (no id)`);
      continue;
    }
    let squad: string[] = [];
    try {
      squad = await getSquadPlayerIds(nation, ref.url);
    } catch (e) {
      console.warn(`! ${nation}: squad fetch failed: ${(e as Error).message}`);
      continue;
    }
    const profiles = await pool(squad, CONCURRENCY, (pid) => getProfile(pid));
    const players = profiles
      .filter((p): p is TmProfile => !!p && !!p.name)
      .map((p) => buildPlayer(nation, p));
    all.push(...players);
    console.log(`✓ ${nation.padEnd(24)} ${players.length}/${squad.length} players`);
  }

  // Stable sort for deterministic output.
  all.sort((a, b) =>
    a.represented_country.localeCompare(b.represented_country) ||
    a.name.localeCompare(b.name)
  );

  writeFileSync(OUT, JSON.stringify(all, null, 2));
  const dual = all.filter((p) => p.citizenships.length > 1).length;
  console.log(
    `\n✔ Wrote ${all.length} players (${dual} multi-citizenship) to data/players.generated.json`
  );
}

main().catch((e) => {
  console.error("Fetch failed:", e);
  process.exit(1);
});
