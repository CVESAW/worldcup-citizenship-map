/**
 * Domain types shared across the data layer, API routes, and UI.
 *
 * The schema is intentionally generic: a `Player` has an arbitrary set of
 * `Citizenship` records, so future expansion (ancestry, transfer history,
 * eligibility, etc.) can be added without breaking the core model.
 */

export interface CitizenshipRow {
  id: string;
  player_id: string;
  country: string;
  is_primary: boolean;
}

export interface PlayerRow {
  id: string;
  name: string;
  represented_country: string;
  birth_country: string;
  club: string;
  position: string;
  image_url: string | null;
  /** Transfermarkt market value in euros (null if unknown). */
  market_value: number | null;
}

/** A player with its citizenship records joined in. */
export interface Player extends PlayerRow {
  citizenships: CitizenshipRow[];
}

/** Aggregated view used to colour and label the world map. */
export interface CountrySummary {
  /** Canonical display name, e.g. "Nigeria". */
  country: string;
  /** Number of distinct players holding citizenship of this country. */
  playerCount: number;
  /** Number of those players who hold more than one citizenship. */
  dualCount: number;
}

/** Country detail returned when a country is selected. */
export interface CountryDetail extends CountrySummary {
  players: Player[];
}

/** Team detail returned when a club is searched/selected. */
export interface TeamDetail {
  team: string;
  playerCount: number;
  players: Player[];
  /** Every distinct citizenship country represented in this squad. */
  countries: string[];
}

/** A minimal player reference used in stats detail panels. */
export interface PlayerRef {
  id: string;
  name: string;
  club: string;
  represented_country: string;
  /** Optional market value (euros), shown in some stats detail chips. */
  value?: number | null;
}

/** One ranked row in a stats category, with detail shown on expand. */
export interface RankedItem {
  id: string;
  label: string;
  value: number;
  /** Optional formatted value shown instead of the raw number (e.g. "€1.2bn"). */
  display?: string;
  subtitle?: string;
  /** Detail: citizenship countries (rendered as flags). */
  countries?: string[];
  /** Detail: players (rendered as chips linking to profiles). */
  players?: PlayerRef[];
}

export interface StatsData {
  kpis: {
    players: number;
    countries: number;
    dual: number;
    clubs: number;
    nations: number;
    uniqueCombos: number;
  };
  mostLinkedCountries: RankedItem[];
  mostValuableCountries: RankedItem[];
  mostDualCountries: RankedItem[];
  mostDiverseTeams: RankedItem[];
  leastDiverseTeams: RankedItem[];
  clubsMostPlayers: RankedItem[];
  topExporters: RankedItem[];
  foreignBornTeams: RankedItem[];
  topBirthCountries: RankedItem[];
  commonCombos: RankedItem[];
}

export interface QuizPlayer {
  id: string;
  name: string;
  club: string;
  image_url: string | null;
  represented_country: string;
  citizenships: string[];
}

/**
 * One round of the citizenship game: several players who all share one
 * citizenship — guess which country they all hold.
 */
export interface QuizQuestion {
  id: string;
  players: QuizPlayer[];
  /** 4 country options, shuffled. */
  options: string[];
  /** The correct option — the citizenship every shown player holds. */
  answer: string;
}

export type SearchResultType = "player" | "country" | "team";

export interface SearchResult {
  type: SearchResultType;
  /** Stable id: player id, or the country/team name. */
  id: string;
  /** Primary line shown in the dropdown. */
  label: string;
  /** Secondary muted line (club, player count, etc.). */
  sublabel: string;
}
