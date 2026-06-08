/**
 * Data import system.
 *
 * Populates the Supabase `players` + `citizenships` tables from JSON.
 *
 * Usage:
 *   npm run import                 # imports the bundled sample dataset
 *   npm run import ./data.json     # imports a custom JSON file
 *
 * Accepts either a single player object or an array of them. Each player:
 *   {
 *     "name": "Bukayo Saka",
 *     "represented_country": "England",
 *     "birth_country": "England",
 *     "club": "Arsenal",
 *     "position": "RW",            // optional
 *     "image_url": null,           // optional
 *     "citizenships": ["England", "Nigeria"]
 *   }
 *
 * `citizenships` may be an array of strings (first is treated as primary) or an
 * array of { country, is_primary } objects.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (the service
 * role bypasses RLS so it can write). Configure them in `.env.local`.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { SEED_PLAYERS } from "../lib/data/seed";

config({ path: ".env.local" });
config(); // also load .env if present

interface InputPlayer {
  name: string;
  represented_country: string;
  birth_country: string;
  club: string;
  position?: string;
  image_url?: string | null;
  market_value?: number | null;
  citizenships: Array<string | { country: string; is_primary?: boolean }>;
}

function normalizeCitizenships(
  raw: InputPlayer["citizenships"]
): { country: string; is_primary: boolean }[] {
  return raw.map((c, i) =>
    typeof c === "string"
      ? { country: c, is_primary: i === 0 }
      : { country: c.country, is_primary: c.is_primary ?? i === 0 }
  );
}

function loadInput(): InputPlayer[] {
  const fileArg = process.argv[2];
  if (fileArg) {
    const path = resolve(process.cwd(), fileArg);
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return Array.isArray(parsed) ? parsed : [parsed];
  }
  // Default: the full Transfermarkt-sourced dataset if it exists, else the seed.
  const generated = resolve(process.cwd(), "data", "players.generated.json");
  if (existsSync(generated)) {
    const parsed = JSON.parse(readFileSync(generated, "utf8"));
    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log(`ℹ Importing the generated dataset (${parsed.length} players).`);
      return parsed;
    }
  }
  console.log("ℹ Importing the bundled sample dataset.");
  return SEED_PLAYERS as InputPlayer[];
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "✖ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "  Set them in .env.local (see .env.example) before importing."
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const players = loadInput();
  console.log(`→ Importing ${players.length} player(s)…`);

  let inserted = 0;
  let citizenshipCount = 0;

  for (const p of players) {
    if (!p.name || !p.represented_country) {
      console.warn(`  ⚠ Skipping invalid record: ${JSON.stringify(p).slice(0, 80)}`);
      continue;
    }

    const { data: player, error: playerErr } = await supabase
      .from("players")
      .insert({
        name: p.name,
        represented_country: p.represented_country,
        birth_country: p.birth_country ?? p.represented_country,
        club: p.club ?? "",
        position: p.position ?? "",
        image_url: p.image_url ?? null,
        market_value: p.market_value ?? null,
      })
      .select("id")
      .single();

    if (playerErr || !player) {
      console.error(`  ✖ Failed to insert ${p.name}:`, playerErr?.message);
      continue;
    }

    const citizenships = normalizeCitizenships(p.citizenships ?? []).map((c) => ({
      player_id: player.id,
      country: c.country,
      is_primary: c.is_primary,
    }));

    if (citizenships.length > 0) {
      const { error: cErr } = await supabase
        .from("citizenships")
        .insert(citizenships);
      if (cErr) {
        console.error(`  ✖ Citizenships for ${p.name}:`, cErr.message);
      } else {
        citizenshipCount += citizenships.length;
      }
    }

    inserted++;
    console.log(`  ✓ ${p.name} (${citizenships.length} citizenship records)`);
  }

  console.log(
    `\n✔ Done. Inserted ${inserted} players and ${citizenshipCount} citizenship records.`
  );
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
