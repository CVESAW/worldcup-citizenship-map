/**
 * Data access layer.
 *
 * A single source of truth for the API routes and server components. All higher
 * level queries (country summaries, country/team detail, search) are computed in
 * memory over the full player list, so behaviour is identical whether the data
 * comes from Supabase or the bundled seed dataset. The dataset is small and the
 * full list is cached per request, keeping click responses well under 200ms.
 */

import { cache } from "react";
import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { SEED_PLAYERS, type SeedPlayer } from "@/lib/data/seed";
import { GENERATED_PLAYERS } from "@/lib/data/generated";
import { countryToGeoName } from "@/lib/countries";
import { normalize, formatEuros } from "@/lib/utils";
import type {
  CountryDetail,
  CountrySummary,
  Player,
  PlayerRow,
  PlayerRef,
  CitizenshipRow,
  QuizQuestion,
  QuizPlayer,
  RankedItem,
  SearchResult,
  StatsData,
  TeamDetail,
} from "@/lib/types";

/** Stable slug used as the id for seed players. */
export function slugify(value: string): string {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Prefer the full Transfermarkt-sourced dataset; fall back to the sample seed. */
function localPlayers(): SeedPlayer[] {
  return GENERATED_PLAYERS.length > 0 ? GENERATED_PLAYERS : SEED_PLAYERS;
}

function buildSeedPlayers(): Player[] {
  const seen = new Map<string, number>();
  return localPlayers().map((p: SeedPlayer) => {
    let id = slugify(p.name);
    // Guard against duplicate slugs.
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;

    const citizenships: CitizenshipRow[] = p.citizenships.map((country, i) => ({
      id: `${id}--${slugify(country)}`,
      player_id: id,
      country,
      is_primary: i === 0,
    }));

    return {
      id,
      name: p.name,
      represented_country: p.represented_country,
      birth_country: p.birth_country,
      club: p.club,
      position: p.position,
      image_url: p.image_url ?? null,
      market_value: p.market_value ?? null,
      citizenships,
    } satisfies Player;
  });
}

/**
 * Fetch every player with citizenships joined. Cached for the lifetime of a
 * single server request via React `cache()`.
 */
export const getAllPlayers = cache(async (): Promise<Player[]> => {
  if (!isSupabaseConfigured()) {
    return buildSeedPlayers();
  }

  const supabase = getServerSupabase();
  if (!supabase) return buildSeedPlayers();

  const { data, error } = await supabase
    .from("players")
    .select(
      "id,name,represented_country,birth_country,club,position,image_url,market_value,citizenships(id,player_id,country,is_primary)"
    )
    .order("name");

  if (error) {
    console.error("[repository] Supabase query failed, using seed data:", error.message);
    return buildSeedPlayers();
  }

  return (data ?? []).map((row) => {
    const { citizenships, ...rest } = row as PlayerRow & {
      citizenships: CitizenshipRow[] | null;
    };
    const list = citizenships ?? [];
    // Primary citizenship first, then alphabetical.
    list.sort((a, b) =>
      a.is_primary === b.is_primary
        ? a.country.localeCompare(b.country)
        : a.is_primary
          ? -1
          : 1
    );
    return { ...rest, citizenships: list } satisfies Player;
  });
});

/** Player lookup by id. */
export async function getPlayer(id: string): Promise<Player | null> {
  const players = await getAllPlayers();
  return players.find((p) => p.id === id) ?? null;
}

/** Per-country aggregates for the map, keyed by canonical country name. */
export const getCountrySummaries = cache(async (): Promise<CountrySummary[]> => {
  const players = await getAllPlayers();
  const map = new Map<string, { players: Set<string>; dual: Set<string> }>();

  for (const player of players) {
    const isDual = player.citizenships.length > 1;
    for (const c of player.citizenships) {
      let entry = map.get(c.country);
      if (!entry) {
        entry = { players: new Set(), dual: new Set() };
        map.set(c.country, entry);
      }
      entry.players.add(player.id);
      if (isDual) entry.dual.add(player.id);
    }
  }

  return [...map.entries()]
    .map(([country, v]) => ({
      country,
      playerCount: v.players.size,
      dualCount: v.dual.size,
    }))
    .sort((a, b) => b.playerCount - a.playerCount);
});

/**
 * Map view-model: total player count per topojson shape name, so the map can
 * colour shapes directly. Home nations (England/Scotland/...) collapse into the
 * single "United Kingdom" shape.
 */
export const getGeoCounts = cache(
  async (): Promise<Record<string, number>> => {
    const players = await getAllPlayers();
    const byGeo = new Map<string, Set<string>>();
    for (const player of players) {
      for (const c of player.citizenships) {
        const geo = countryToGeoName(c.country);
        let set = byGeo.get(geo);
        if (!set) {
          set = new Set();
          byGeo.set(geo, set);
        }
        set.add(player.id);
      }
    }
    const out: Record<string, number> = {};
    for (const [geo, set] of byGeo) out[geo] = set.size;
    return out;
  }
);

/**
 * Map view-model for "National team" mode: number of players who *represent*
 * each shape's nation (i.e. squad sizes), keyed by topojson shape name.
 */
export const getGeoRepCounts = cache(
  async (): Promise<Record<string, number>> => {
    const players = await getAllPlayers();
    const byGeo = new Map<string, Set<string>>();
    for (const player of players) {
      const geo = countryToGeoName(player.represented_country);
      let set = byGeo.get(geo);
      if (!set) {
        set = new Set();
        byGeo.set(geo, set);
      }
      set.add(player.id);
    }
    const out: Record<string, number> = {};
    for (const [geo, set] of byGeo) out[geo] = set.size;
    return out;
  }
);

/** Squad size per represented nation (canonical country name). */
export const getRepCountsByCountry = cache(
  async (): Promise<Record<string, number>> => {
    const players = await getAllPlayers();
    const out: Record<string, number> = {};
    for (const p of players) {
      out[p.represented_country] = (out[p.represented_country] ?? 0) + 1;
    }
    return out;
  }
);

/** All players holding citizenship of a given country (case-insensitive). */
export async function getCountryDetail(country: string): Promise<CountryDetail | null> {
  const players = await getAllPlayers();
  const target = normalize(country);
  const matches = players.filter((p) =>
    p.citizenships.some((c) => normalize(c.country) === target)
  );
  if (matches.length === 0) return null;

  // Canonical display name from the first matching citizenship record.
  const displayName =
    matches[0].citizenships.find((c) => normalize(c.country) === target)?.country ??
    country;

  return {
    country: displayName,
    playerCount: matches.length,
    dualCount: matches.filter((p) => p.citizenships.length > 1).length,
    players: matches,
  };
}

/** Squad detail for a club (case-insensitive exact-ish match). */
export async function getTeamDetail(team: string): Promise<TeamDetail | null> {
  const players = await getAllPlayers();
  const target = normalize(team);
  const matches = players.filter((p) => normalize(p.club) === target);
  if (matches.length === 0) return null;

  const countries = [
    ...new Set(matches.flatMap((p) => p.citizenships.map((c) => c.country))),
  ].sort();

  return {
    team: matches[0].club,
    playerCount: matches.length,
    players: matches,
    countries,
  };
}

/**
 * Build N rounds for the citizenship game. Each round shows `groupSize` players
 * who all hold one country's citizenship; the player guesses which country.
 */
export async function getQuizQuestions(count = 12, groupSize = 3): Promise<QuizQuestion[]> {
  const players = await getAllPlayers();
  const allCountries = [
    ...new Set(players.flatMap((p) => p.citizenships.map((c) => c.country))),
  ];

  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Players with a portrait, grouped by each citizenship they hold.
  const withFace = players.filter((p) => p.image_url);
  const byCountry = new Map<string, Player[]>();
  for (const p of withFace) {
    for (const c of p.citizenships) {
      const list = byCountry.get(c.country) ?? [];
      list.push(p);
      byCountry.set(c.country, list);
    }
  }

  // Only countries with enough portrait-holders to fill a group.
  const targets = shuffle(
    [...byCountry.entries()].filter(([, list]) => list.length >= groupSize).map(([c]) => c)
  );
  if (targets.length === 0) return [];

  const toQuizPlayer = (p: Player): QuizPlayer => ({
    id: p.id,
    name: p.name,
    club: p.club,
    image_url: p.image_url,
    represented_country: p.represented_country,
    citizenships: p.citizenships.map((c) => c.country),
  });

  const out: QuizQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const target = targets[i % targets.length];
    const group = shuffle(byCountry.get(target)!).slice(0, groupSize);

    // Countries every player in the group shares (could be more than the target).
    const shared = group
      .map((p) => new Set(p.citizenships.map((c) => c.country)))
      .reduce((acc, set) => new Set([...acc].filter((c) => set.has(c))));

    // Distractors must NOT be shared by all (so `target` is the only answer).
    const distractors = shuffle(
      allCountries.filter((c) => !shared.has(c))
    ).slice(0, 3);

    out.push({
      id: `${target}-${i}`,
      players: group.map(toQuizPlayer),
      options: shuffle([target, ...distractors]),
      answer: target,
    });
  }
  return out;
}

/** Distinct club names. */
export const getAllTeams = cache(async (): Promise<string[]> => {
  const players = await getAllPlayers();
  return [...new Set(players.map((p) => p.club))].sort();
});

/**
 * Unified search across players, countries, and clubs. Ranks exact prefix
 * matches above substring matches; capped to keep the dropdown snappy.
 */
export async function search(query: string, limit = 12): Promise<SearchResult[]> {
  const q = normalize(query);
  if (!q) return [];

  const players = await getAllPlayers();
  const results: (SearchResult & { score: number })[] = [];

  const score = (haystack: string): number => {
    const h = normalize(haystack);
    if (h === q) return 3;
    if (h.startsWith(q)) return 2;
    if (h.includes(q)) return 1;
    return 0;
  };

  // Players
  for (const p of players) {
    const s = score(p.name);
    if (s > 0) {
      results.push({
        type: "player",
        id: p.id,
        label: p.name,
        sublabel: `${p.position} · ${p.club}`,
        score: s,
      });
    }
  }

  // Countries (with player counts)
  const summaries = await getCountrySummaries();
  for (const c of summaries) {
    const s = score(c.country);
    if (s > 0) {
      results.push({
        type: "country",
        id: c.country,
        label: c.country,
        sublabel: `${c.playerCount} player${c.playerCount === 1 ? "" : "s"}`,
        score: s + 0.5, // nudge countries above same-rank players
      });
    }
  }

  // Teams
  const teams = await getAllTeams();
  for (const t of teams) {
    const s = score(t);
    if (s > 0) {
      const count = players.filter((p) => p.club === t).length;
      results.push({
        type: "team",
        id: t,
        label: t,
        sublabel: `${count} player${count === 1 ? "" : "s"} · Team`,
        score: s + 0.25,
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map(
      (r): SearchResult => ({
        type: r.type,
        id: r.id,
        label: r.label,
        sublabel: r.sublabel,
      })
    );
}

// ---- Statistics ------------------------------------------------------------

const toRef = (p: Player): PlayerRef => ({
  id: p.id,
  name: p.name,
  club: p.club,
  represented_country: p.represented_country,
});

const DETAIL_CAP = 30; // limit detail payloads

/** Everything the /stats page needs, computed in one pass over the dataset. */
export const getStats = cache(async (): Promise<StatsData> => {
  const players = await getAllPlayers();
  const summaries = await getCountrySummaries();

  // --- Countries: most linked + most dual (with sample players) ---
  const byCountryPlayers = new Map<string, Player[]>();
  for (const p of players) {
    for (const c of p.citizenships) {
      const list = byCountryPlayers.get(c.country) ?? [];
      list.push(p);
      byCountryPlayers.set(c.country, list);
    }
  }

  const mostLinkedCountries: RankedItem[] = summaries.slice(0, 15).map((s) => ({
    id: s.country,
    label: s.country,
    value: s.playerCount,
    subtitle: `${s.dualCount} dual-citizen${s.dualCount === 1 ? "" : "s"}`,
    players: (byCountryPlayers.get(s.country) ?? []).slice(0, DETAIL_CAP).map(toRef),
  }));

  // Countries ranked by the combined market value of all their citizens.
  const mostValuableCountries: RankedItem[] = [...byCountryPlayers.entries()]
    .map(([country, members]) => {
      const total = members.reduce((sum, p) => sum + (p.market_value ?? 0), 0);
      const byValue = [...members].sort(
        (a, b) => (b.market_value ?? 0) - (a.market_value ?? 0)
      );
      return {
        id: country,
        label: country,
        value: total,
        display: formatEuros(total),
        subtitle: `${members.length} citizen${members.length === 1 ? "" : "s"}`,
        players: byValue.slice(0, DETAIL_CAP).map((p) => ({
          ...toRef(p),
          value: p.market_value,
        })),
      } satisfies RankedItem;
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 15);

  const mostDualCountries: RankedItem[] = [...summaries]
    .filter((s) => s.dualCount > 0)
    .sort((a, b) => b.dualCount - a.dualCount)
    .slice(0, 15)
    .map((s) => ({
      id: s.country,
      label: s.country,
      value: s.dualCount,
      subtitle: `of ${s.playerCount} citizens`,
      players: (byCountryPlayers.get(s.country) ?? [])
        .filter((p) => p.citizenships.length > 1)
        .slice(0, DETAIL_CAP)
        .map(toRef),
    }));

  // --- Diversity by national team and by club ---
  const teamGroups = groupBy(players, (p) => p.represented_country);
  const teamDiversity = diversityRanking(teamGroups);
  const mostDiverseTeams = teamDiversity.slice(0, 12);
  const leastDiverseTeams = [...teamDiversity]
    .sort((a, b) => a.value - b.value || a.label.localeCompare(b.label))
    .slice(0, 12);

  const clubGroups = groupBy(
    players.filter((p) => p.club && p.club !== "—"),
    (p) => p.club
  );

  // --- Clubs supplying the most players to national-team squads ---
  const clubsMostPlayers: RankedItem[] = [...clubGroups.entries()]
    .map(([club, members]) => {
      const distinct = new Set(
        members.flatMap((p) => p.citizenships.map((c) => c.country))
      ).size;
      return {
        id: club,
        label: club,
        value: members.length,
        subtitle: `${distinct} citizenship countr${distinct === 1 ? "y" : "ies"}`,
        players: members.slice(0, DETAIL_CAP).map(toRef),
      } satisfies RankedItem;
    })
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 12);

  // --- Top talent "exporters": hold a citizenship but represent another nation ---
  const topExporters: RankedItem[] = summaries
    .map((s) => {
      const exported = (byCountryPlayers.get(s.country) ?? []).filter(
        (p) => normalize(p.represented_country) !== normalize(s.country)
      );
      return {
        id: s.country,
        label: s.country,
        value: exported.length,
        subtitle: "citizens representing other nations",
        players: exported.slice(0, DETAIL_CAP).map(toRef),
      } satisfies RankedItem;
    })
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 12);

  // --- Most foreign-born squads: players born outside the nation they represent ---
  const foreignBornTeams: RankedItem[] = [...teamGroups.entries()]
    .map(([team, members]) => {
      const foreign = members.filter(
        (p) => normalize(p.birth_country) !== normalize(team)
      );
      return {
        id: team,
        label: team,
        value: foreign.length,
        subtitle: `of ${members.length} in squad`,
        players: foreign.slice(0, DETAIL_CAP).map(toRef),
      } satisfies RankedItem;
    })
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 12);

  // --- Top birth countries: where WC players were physically born ---
  const topBirthCountries: RankedItem[] = [...groupBy(players, (p) => p.birth_country).entries()]
    .map(([country, members]) => ({
      id: country,
      label: country,
      value: members.length,
      subtitle: "players born here",
      players: members.slice(0, DETAIL_CAP).map(toRef),
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 12);

  // --- Citizenship combinations (multi-nationality players) ---
  const comboMap = new Map<string, { countries: string[]; players: Player[] }>();
  for 