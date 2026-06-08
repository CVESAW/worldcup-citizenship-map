-- World Cup Citizenship Map — initial schema
-- The schema is intentionally generic so it can be extended later (ancestry,
-- transfer history, eligibility, etc.) without breaking the core model.

create extension if not exists "pgcrypto";

create table if not exists public.players (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  represented_country text not null,
  birth_country       text not null,
  club                text not null,
  position            text not null default '',
  image_url           text,
  market_value        bigint,
  created_at          timestamptz not null default now()
);

create table if not exists public.citizenships (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references public.players (id) on delete cascade,
  country    text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (player_id, country)
);

-- Indexes for the common lookups (country/club filters, joins).
create index if not exists idx_players_club on public.players (lower(club));
create index if not exists idx_players_name on public.players (lower(name));
create index if not exists idx_citizenships_player on public.citizenships (player_id);
create index if not exists idx_citizenships_country on public.citizenships (lower(country));

-- Row Level Security: data is public-read; writes only via the service role
-- (the import script), which bypasses RLS.
alter table public.players enable row level security;
alter table public.citizenships enable row level security;

drop policy if exists "Public read players" on public.players;
create policy "Public read players"
  on public.players for select
  using (true);

drop policy if exists "Public read citizenships" on public.citizenships;
create policy "Public read citizenships"
  on public.citizenships for select
  using (true);
