/**
 * Sample dataset used as the local fallback when Supabase is not configured,
 * and as the source for `scripts/import_players.ts`.
 *
 * Citizenships are listed primary-first. The data is illustrative — it models
 * well-known dual/triple-nationality cases to make the map interesting — and is
 * not an authoritative squad list.
 */

export interface SeedPlayer {
  name: string;
  represented_country: string;
  birth_country: string;
  club: string;
  position: string;
  image_url?: string | null;
  /** Market value in euros (optional). */
  market_value?: number | null;
  /** Primary citizenship first. */
  citizenships: string[];
}

export const SEED_PLAYERS: SeedPlayer[] = [
  // Arsenal
  { name: "Bukayo Saka", represented_country: "England", birth_country: "England", club: "Arsenal", position: "RW", citizenships: ["England", "Nigeria"] },
  { name: "Declan Rice", represented_country: "England", birth_country: "England", club: "Arsenal", position: "CM", citizenships: ["England", "Ireland"] },
  { name: "William Saliba", represented_country: "France", birth_country: "France", club: "Arsenal", position: "CB", citizenships: ["France", "Lebanon"] },
  { name: "Gabriel Martinelli", represented_country: "Brazil", birth_country: "Brazil", club: "Arsenal", position: "LW", citizenships: ["Brazil", "Italy"] },
  { name: "Gabriel Jesus", represented_country: "Brazil", birth_country: "Brazil", club: "Arsenal", position: "ST", citizenships: ["Brazil"] },
  { name: "Kai Havertz", represented_country: "Germany", birth_country: "Germany", club: "Arsenal", position: "ST", citizenships: ["Germany"] },
  { name: "Thomas Partey", represented_country: "Ghana", birth_country: "Ghana", club: "Arsenal", position: "CM", citizenships: ["Ghana"] },
  { name: "David Raya", represented_country: "Spain", birth_country: "Spain", club: "Arsenal", position: "GK", citizenships: ["Spain"] },

  // Manchester City
  { name: "Erling Haaland", represented_country: "Norway", birth_country: "England", club: "Manchester City", position: "ST", citizenships: ["Norway", "England"] },
  { name: "Phil Foden", represented_country: "England", birth_country: "England", club: "Manchester City", position: "MF", citizenships: ["England"] },
  { name: "Kevin De Bruyne", represented_country: "Belgium", birth_country: "Belgium", club: "Manchester City", position: "MF", citizenships: ["Belgium"] },
  { name: "Rúben Dias", represented_country: "Portugal", birth_country: "Portugal", club: "Manchester City", position: "CB", citizenships: ["Portugal"] },
  { name: "Rodri", represented_country: "Spain", birth_country: "Spain", club: "Manchester City", position: "CM", citizenships: ["Spain"] },
  { name: "Joško Gvardiol", represented_country: "Croatia", birth_country: "Croatia", club: "Manchester City", position: "CB", citizenships: ["Croatia"] },

  // Real Madrid
  { name: "Vinícius Júnior", represented_country: "Brazil", birth_country: "Brazil", club: "Real Madrid", position: "LW", citizenships: ["Brazil"] },
  { name: "Jude Bellingham", represented_country: "England", birth_country: "England", club: "Real Madrid", position: "MF", citizenships: ["England"] },
  { name: "Kylian Mbappé", represented_country: "France", birth_country: "France", club: "Real Madrid", position: "ST", citizenships: ["France", "Cameroon", "Algeria"] },
  { name: "Rodrygo", represented_country: "Brazil", birth_country: "Brazil", club: "Real Madrid", position: "RW", citizenships: ["Brazil"] },
  { name: "Antonio Rüdiger", represented_country: "Germany", birth_country: "Germany", club: "Real Madrid", position: "CB", citizenships: ["Germany", "Sierra Leone"] },
  { name: "Aurélien Tchouaméni", represented_country: "France", birth_country: "France", club: "Real Madrid", position: "CM", citizenships: ["France", "Cameroon"] },
  { name: "Eduardo Camavinga", represented_country: "France", birth_country: "Angola", club: "Real Madrid", position: "CM", citizenships: ["France", "Angola", "DR Congo"] },
  { name: "Federico Valverde", represented_country: "Uruguay", birth_country: "Uruguay", club: "Real Madrid", position: "CM", citizenships: ["Uruguay"] },

  // Barcelona
  { name: "Robert Lewandowski", represented_country: "Poland", birth_country: "Poland", club: "Barcelona", position: "ST", citizenships: ["Poland"] },
  { name: "Lamine Yamal", represented_country: "Spain", birth_country: "Spain", club: "Barcelona", position: "RW", citizenships: ["Spain", "Morocco", "Equatorial Guinea"] },
  { name: "Frenkie de Jong", represented_country: "Netherlands", birth_country: "Netherlands", club: "Barcelona", position: "MF", citizenships: ["Netherlands"] },
  { name: "Pedri", represented_country: "Spain", birth_country: "Spain", club: "Barcelona", position: "MF", citizenships: ["Spain"] },
  { name: "Raphinha", represented_country: "Brazil", birth_country: "Brazil", club: "Barcelona", position: "RW", citizenships: ["Brazil", "Italy"] },
  { name: "Jules Koundé", represented_country: "France", birth_country: "France", club: "Barcelona", position: "CB", citizenships: ["France", "Benin"] },

  // Bayern Munich
  { name: "Harry Kane", represented_country: "England", birth_country: "England", club: "Bayern Munich", position: "ST", citizenships: ["England", "Ireland"] },
  { name: "Jamal Musiala", represented_country: "Germany", birth_country: "Germany", club: "Bayern Munich", position: "MF", citizenships: ["Germany", "England", "Nigeria"] },
  { name: "Joshua Kimmich", represented_country: "Germany", birth_country: "Germany", club: "Bayern Munich", position: "MF", citizenships: ["Germany"] },
  { name: "Leroy Sané", represented_country: "Germany", birth_country: "Germany", club: "Bayern Munich", position: "RW", citizenships: ["Germany", "Senegal"] },
  { name: "Alphonso Davies", represented_country: "Canada", birth_country: "Ghana", club: "Bayern Munich", position: "LB", citizenships: ["Canada", "Liberia"] },
  { name: "Dayot Upamecano", represented_country: "France", birth_country: "France", club: "Bayern Munich", position: "CB", citizenships: ["France", "Guinea-Bissau"] },

  // Paris Saint-Germain
  { name: "Ousmane Dembélé", represented_country: "France", birth_country: "France", club: "Paris Saint-Germain", position: "RW", citizenships: ["France", "Mali", "Senegal"] },
  { name: "Achraf Hakimi", represented_country: "Morocco", birth_country: "Spain", club: "Paris Saint-Germain", position: "RB", citizenships: ["Morocco", "Spain"] },
  { name: "Gianluigi Donnarumma", represented_country: "Italy", birth_country: "Italy", club: "Paris Saint-Germain", position: "GK", citizenships: ["Italy"] },
  { name: "Marquinhos", represented_country: "Brazil", birth_country: "Brazil", club: "Paris Saint-Germain", position: "CB", citizenships: ["Brazil", "Italy"] },
  { name: "Vitinha", represented_country: "Portugal", birth_country: "Portugal", club: "Paris Saint-Germain", position: "MF", citizenships: ["Portugal"] },

  // Liverpool
  { name: "Mohamed Salah", represented_country: "Egypt", birth_country: "Egypt", club: "Liverpool", position: "RW", citizenships: ["Egypt"] },
  { name: "Virgil van Dijk", represented_country: "Netherlands", birth_country: "Netherlands", club: "Liverpool", position: "CB", citizenships: ["Netherlands", "Suriname"] },
  { name: "Darwin Núñez", represented_country: "Uruguay", birth_country: "Uruguay", club: "Liverpool", position: "ST", citizenships: ["Uruguay"] },
  { name: "Luis Díaz", represented_country: "Colombia", birth_country: "Colombia", club: "Liverpool", position: "LW", citizenships: ["Colombia"] },
  { name: "Cody Gakpo", represented_country: "Netherlands", birth_country: "Netherlands", club: "Liverpool", position: "FW", citizenships: ["Netherlands", "Togo"] },

  // Manchester United
  { name: "Marcus Rashford", represented_country: "England", birth_country: "England", club: "Manchester United", position: "FW", citizenships: ["England"] },
  { name: "Bruno Fernandes", represented_country: "Portugal", birth_country: "Portugal", club: "Manchester United", position: "MF", citizenships: ["Portugal"] },
  { name: "Casemiro", represented_country: "Brazil", birth_country: "Brazil", club: "Manchester United", position: "CM", citizenships: ["Brazil", "Spain"] },
  { name: "Rasmus Højlund", represented_country: "Denmark", birth_country: "Denmark", club: "Manchester United", position: "ST", citizenships: ["Denmark"] },

  // Chelsea
  { name: "Enzo Fernández", represented_country: "Argentina", birth_country: "Argentina", club: "Chelsea", position: "MF", citizenships: ["Argentina", "Italy"] },
  { name: "Moisés Caicedo", represented_country: "Ecuador", birth_country: "Ecuador", club: "Chelsea", position: "CM", citizenships: ["Ecuador"] },
  { name: "Nicolas Jackson", represented_country: "Senegal", birth_country: "Gambia", club: "Chelsea", position: "ST", citizenships: ["Senegal", "Gambia"] },
  { name: "Cole Palmer", represented_country: "England", birth_country: "England", club: "Chelsea", position: "MF", citizenships: ["England", "Saint Kitts and Nevis"] },

  // Inter Milan
  { name: "Lautaro Martínez", represented_country: "Argentina", birth_country: "Argentina", club: "Inter Milan", position: "ST", citizenships: ["Argentina", "Italy"] },
  { name: "Marcus Thuram", represented_country: "France", birth_country: "Italy", club: "Inter Milan", position: "ST", citizenships: ["France", "Italy"] },

  // Juventus
  { name: "Dušan Vlahović", represented_country: "Serbia", birth_country: "Serbia", club: "Juventus", position: "ST", citizenships: ["Serbia"] },

  // Al Nassr
  { name: "Cristiano Ronaldo", represented_country: "Portugal", birth_country: "Portugal", club: "Al Nassr", position: "FW", citizenships: ["Portugal"] },

  // Inter Miami
  { name: "Lionel Messi", represented_country: "Argentina", birth_country: "Argentina", club: "Inter Miami", position: "FW", citizenships: ["Argentina", "Italy", "Spain"] },
];
