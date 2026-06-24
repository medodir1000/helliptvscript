-- ===========================================================================
-- fixtures: one row per event / channel landing page.
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ===========================================================================

create table if not exists public.fixtures (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  event_title   text not null,
  broadcaster   text,
  date_time     timestamptz not null,
  language      text default 'en',
  category      text,
  event_ref     text, -- TheSportsDB idEvent, for live-score lookup
  content_cache text,
  created_at    timestamptz default now()
);

-- Fast lookups for the related-events block (same category, upcoming).
create index if not exists fixtures_category_date_idx
  on public.fixtures (category, date_time);

-- Row Level Security: the site uses the public anon key, so expose READ ONLY.
-- Writes should go through the service_role key from a trusted server/Edge
-- Function — never from the browser.
alter table public.fixtures enable row level security;

drop policy if exists "Public read fixtures" on public.fixtures;
create policy "Public read fixtures"
  on public.fixtures
  for select
  using (true);

-- ---------------------------------------------------------------------------
-- Seed data (upcoming, so the countdown + related block render immediately).
-- ---------------------------------------------------------------------------
insert into public.fixtures (slug, event_title, broadcaster, date_time, language, category, content_cache)
values
  ('mexico-vs-usa-2026', 'Mexico vs USA', 'Telemundo', now() + interval '3 days',  'en', 'Football',
   'Mexico face the USA in a marquee fixture. Find the start time, the official broadcaster for your region, and check your connection quality before kickoff.'),
  ('canelo-vs-benavidez', 'Canelo vs Benavidez', 'DAZN', now() + interval '6 days', 'en', 'Boxing',
   'A long-awaited super-middleweight showdown. Main-card and main-event ring-walk times, plus the official broadcaster and where to watch.'),
  ('lakers-vs-celtics', 'Lakers vs Celtics', 'ESPN', now() + interval '2 days', 'en', 'Basketball',
   'A classic rivalry renewed. Tip-off time, official broadcaster and a quick connection check for a smooth stream.'),
  ('monaco-grand-prix', 'Monaco Grand Prix', 'Sky Sports F1', now() + interval '9 days', 'en', 'Motorsport',
   'Lights out on the streets of Monte Carlo. Session times, the official broadcaster and where to watch live.'),
  ('bein-sports-1', 'beIN Sports 1', 'beIN', now() + interval '1 hour', 'ar', 'TV-Channels',
   'Live schedule and streaming availability for beIN Sports 1, including how to watch through licensed providers in your region.')
on conflict (slug) do nothing;
