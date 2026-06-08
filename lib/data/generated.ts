/**
 * The full World Cup dataset produced by `scripts/fetch_transfermarkt.ts`
 * (Transfermarkt-sourced). Imported statically so it is bundled for production.
 *
 * If the file is empty (pipeline not yet run) the repository falls back to the
 * curated sample in `seed.ts`.
 */
import generated from "../../data/players.generated.json";
import type { SeedPlayer } from "./seed";

export const GENERATED_PLAYERS = generated as SeedPlayer[];
