# Deploy prompt — World Cup Citizenship Map → Vercel

Copy everything in the block below and hand it to a coworker (or an AI coding
agent). It is self-contained.

---

> **Task: deploy this Next.js app to Vercel.**
>
> This is a **Next.js 16 (App Router) + TypeScript + Tailwind v4** project. It
> runs with **no environment variables** — it ships a bundled dataset at
> `data/players.generated.json`, so it works in production as-is. Supabase is
> optional.
>
> **Important install note:** always install with `npm install --legacy-peer-deps`
> (an `.npmrc` with `legacy-peer-deps=true` is committed, so Vercel handles this
> automatically). This is required because `react-simple-maps` declares a React
> 18 peer while the app runs React 19.
>
> ### 1. Sanity-check locally
> ```bash
> npm install --legacy-peer-deps
> npm run build      # must succeed
> npm run lint       # must be clean
> ```
>
> ### 2. Push to GitHub
> The project is not yet a git repo. From the project root:
> ```bash
> git init
> git add -A
> git commit -m "World Cup Citizenship Map"
> gh repo create worldcup-citizenship-map --public --source=. --push
> # (or create a repo in the GitHub UI and `git remote add origin … && git push -u origin main`)
> ```
> Confirm these ARE committed (they're required at runtime): `data/players.generated.json`,
> `public/world-110m.json`, `public/uk-nations.json`, `lib/countries.generated.ts`, `.npmrc`.
> `.tm-cache/` and `.env*` (except `.env.example`) are correctly gitignored.
>
> ### 3. Deploy on Vercel
> **Option A — dashboard (easiest):**
> 1. Go to https://vercel.com/new and import the GitHub repo.
> 2. Framework preset auto-detects **Next.js**. Leave Build Command
>    (`next build`), Output, and Install Command at their defaults.
> 3. Click **Deploy**. No environment variables are needed.
>
> **Option B — CLI:**
> ```bash
> npm i -g vercel
> vercel            # link/create project, accept Next.js defaults
> vercel --prod     # production deploy
> ```
>
> ### 4. (Optional) Use Supabase instead of the bundled data
> Only if a live database is wanted:
> 1. Create a project at supabase.com and run `supabase/migrations/0001_init.sql`
>    in its SQL editor.
> 2. In Vercel → Project → Settings → Environment Variables, add:
>    - `NEXT_PUBLIC_SUPABASE_URL`
>    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
>    - `SUPABASE_SERVICE_ROLE_KEY` (server-only; used only by the import script)
> 3. Locally, copy `.env.example` → `.env.local`, fill the same values, then
>    `npm run import` to load `data/players.generated.json` into Supabase.
> 4. Redeploy. When the env vars are present the app reads Supabase; otherwise it
>    falls back to the bundled dataset automatically.
>
> ### 5. Verify the live deployment
> Open the deployed URL and confirm:
> - The world map renders (dark theme, colour-coded). Toggle the **National team /
>   Linked players / No linked players** views (top-left).
> - Click a country (e.g. **Morocco**) → side panel opens and connection arcs fan
>   out to dual-citizen countries.
> - Search a club (e.g. **Arsenal**) → squad panel + highlighted countries.
> - **/stats** renders all the ranked cards; rows expand on click.
> - A player profile loads, e.g. `/player/kylian-mbappe`.
> - The footer (disclaimer + data attribution) is visible.
>
> Report back the production URL.

---

## Notes for the maintainer

- **No env vars required** — the bundled `data/players.generated.json` is the
  source of truth in production unless Supabase env vars are set.
- **`.npmrc`** (`legacy-peer-deps=true`) is what makes Vercel's install pass.
- To refresh squad data before deploying: `npm run fetch:tm && npm run build:countries`,
  then commit the regenerated `data/players.generated.json` and
  `lib/countries.generated.ts`.
