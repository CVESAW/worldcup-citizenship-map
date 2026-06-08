# World Cup Citizenship Map

An interactive world map that visualises the **citizenships of football players**.
Click any country to instantly see every player who holds its citizenship, or
search a club to highlight all the countries its squad is connected to.

Built to feel fast and data-focused — dark mode by default, a large interactive
hero map, smooth transitions, and snappy (sub-200ms) country/team interactions.

---

## ✨ Features

- **Country mode** — click a country on the map (or search it) to open a side
  panel listing every World Cup player with that citizenship, plus player/dual
  counts. The map also draws **connection arcs** to every country that nation
  shares dual-citizens with — thickness and a label scale with the player count.
- **Team mode** — search a club (e.g. _Arsenal_) to highlight **every country**
  its squad holds citizenship in, and view the full squad list.
- **Global search** — one bar searches **players, countries, and clubs** at once,
  with instant, debounced, keyboard-navigable results.
- **Player profiles** (`/player/[id]`) — photo/monogram, club, represented
  nation, birth country, all citizenships, and a **mini-map** of those countries.
- **Statistics** (`/stats`) — most-linked countries, most dual-citizens, and the
  most citizenship-diverse clubs, visualised with charts.
- **JSON API** — clean REST endpoints for countries, teams, and players.
- **Works with or without a database** — runs immediately on a bundled sample
  dataset; point it at Supabase when you're ready.
- Fully **responsive** (floating panel on desktop, bottom sheet on mobile).

---

## 🧱 Tech stack

| Concern        | Choice                                             |
| -------------- | -------------------------------------------------- |
| Framework      | **Next.js (App Router)** + TypeScript              |
| Styling        | **Tailwind CSS v4** + shadcn-style UI primitives   |
| Data fetching  | **TanStack React Query**                           |
| Database       | **Supabase** (Postgres) — optional, with fallback  |
| Map            | **react-simple-maps** (+ d3-geo, world-atlas)      |
| Charts         | **Recharts**                                       |
| Icons          | **lucide-react**                                   |
| Deployment     | **Vercel**-ready                                   |

> The spec asked for Next.js 15; `create-next-app@latest` now installs Next.js
> 16, which is strictly newer and uses the same App Router. Everything here is
> standard App Router code.

---

## 🚀 Getting started

```bash
npm install
npm run dev
# open http://localhost:3000
```

With no environment variables the app reads the **bundled dataset** at
`data/players.generated.json` — the full squads of all **48 nations** qualified
for the 2026 World Cup, sourced from Transfermarkt (see below). If that file is
empty/absent it falls back to the small curated sample in `lib/data/seed.ts`.
No database is required to explore it.

## 🌐 The dataset (World Cup 2026, Transfermarkt-sourced)

`data/players.generated.json` is produced by a resumable pipeline that pulls
real squad and citizenship data from Transfermarkt via its community REST API:

```bash
npm run fetch:tm          # resolve 48 nations → squads → player profiles
npm run build:countries   # regenerate flag/map-shape metadata for all countries
```

How it works (`scripts/fetch_transfermarkt.ts`):

1. Resolves each of the 48 qualified nations to its Transfermarkt team id
   (verified senior national teams; a few use explicit id overrides).
2. Fetches each national-team page and extracts the current squad's player ids.
3. Enriches every player via the profile endpoint — which returns the **full
   citizenship array** (Transfermarkt tracks every nationality a player holds),
   birth country, club, position and photo.

Everything is cached under `.tm-cache/` so the run is **fully resumable** — re-run
after any interruption and it skips what's already fetched. `npm run build:countries`
then maps every country that appears to an ISO code (flag) and world-atlas shape
(map highlighting), writing `lib/countries.generated.ts`.

> Transfermarkt has no official API; this uses the community wrapper at
> `TM_API_BASE` (default `https://transfermarkt-api.fly.dev`). Squad composition
> reflects whatever Transfermarkt lists at fetch time.

### Using Supabase (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Run the schema migration in the SQL editor (or via the Supabase CLI):
   `supabase/migrations/0001_init.sql`.
3. Copy `.env.example` → `.env.local` and fill in:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...        # server-only, for the import script
   ```

4. Import data:

   ```bash
   npm run import                # imports the bundled sample dataset
   npm run import ./my-data.json # imports your own JSON
   ```

When the env vars are present the app reads from Supabase; otherwise it
transparently falls back to the seed data. Either way the behaviour is identical
because all aggregation happens in one shared data-access layer
(`lib/data/repository.ts`).

---

## 📥 Data import format

`scripts/import_players.ts` accepts a single object or an array. `citizenships`
can be plain strings (first = primary) or `{ country, is_primary }` objects.

```json
{
  "name": "Bukayo Saka",
  "represented_country": "England",
  "birth_country": "England",
  "club": "Arsenal",
  "position": "RW",
  "citizenships": ["England", "Nigeria"]
}
```

---

## 🔌 API routes

All return JSON.

| Route                       | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| `GET /api/countries`        | Per-country aggregates + map view-model (`geoCounts`)  |
| `GET /api/countries/[c]`    | All players holding citizenship `c`                    |
| `GET /api/teams/[team]`     | Squad + every citizenship country represented          |
| `GET /api/players`          | Full player list (with citizenships)                   |
| `GET /api/players?q=saka`   | Unified search (players / countries / teams)           |
| `GET /api/players/[id]`     | Single player                                          |

---

## 🗄️ Database schema

```
players                              citizenships
-------                              ------------
id                  uuid (pk)        id          uuid (pk)
name                text             player_id   uuid -> players.id (cascade)
represented_country text             country     text
birth_country       text            is_primary   boolean
club                text            unique (player_id, country)
position            text
image_url           text
```

A player has many `citizenships`. The schema is deliberately generic — no
World-Cup-specific assumptions are baked in — so it can grow to cover ancestry,
transfer history, eligibility, and more.

---

## 🏗️ Architecture notes

- **One data-access layer** (`lib/data/repository.ts`) backs both the API routes
  and server components, and is the single switch point between Supabase and the
  seed dataset. Aggregations are computed in memory over the player list (cached
  per request with React `cache()`), keeping country/team responses well under
  200 ms.
- **URL-driven state** — the active country/team lives in the query string
  (`/?country=Nigeria`, `/?team=Arsenal`), so selections are shareable,
  SSR-friendly, and back/forward navigation works.
- **Country-name ↔ map matching** is handled by `lib/countries.ts`, which maps
  our canonical names to the world-atlas shape names (e.g. `England → United
  Kingdom`, `Ivory Coast → Côte d'Ivoire`) and to flag emojis / ISO codes. Names
  with no matching shape simply don't highlight — handled gracefully.
- The map topojson is served locally from `public/world-110m.json` for fast,
  offline-friendly loads.

## 📁 Project structure

```
app/
  api/…                 REST endpoints
  player/[id]/page.tsx  player profile (SSR) + mini-map
  stats/page.tsx        statistics (SSR) + charts
  page.tsx              home: hero map + search + side panel
components/             map, search, side panel, cards, UI primitives
lib/
  data/repository.ts    data-access layer (Supabase | generated | seed)
  data/generated.ts     loads data/players.generated.json
  data/seed.ts          curated fallback sample dataset
  countries.ts          name ↔ map-shape ↔ flag mapping
  countries.generated.ts  auto-generated country metadata
  types.ts              shared domain types
data/players.generated.json   full WC2026 dataset (Transfermarkt)
scripts/
  fetch_transfermarkt.ts   builds the dataset from Transfermarkt
  build_countries.ts       regenerates country metadata
  import_players.ts        loads JSON into Supabase
supabase/migrations/0001_init.sql
```

---

## ☁️ Deploying to Vercel

1. Push to a Git repo and import it in Vercel.
2. (Optional) Add the three Supabase env vars in **Project → Settings →
   Environment Variables**.
3. Deploy. No further configuration needed.

---

## 📝 Notes

The dataset is sourced from **Transfermarkt** at fetch time and covers all 48
World Cup 2026 nations. Squad composition reflects what Transfermarkt listed when
the pipeline ran (`npm run fetch:tm` to refresh). Swap in your own data anytime
via Supabase + the import script, or by editing `data/players.generated.json`.
