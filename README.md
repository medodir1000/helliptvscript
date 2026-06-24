# Live Sports & Event Broadcaster Guide

A universal, category-aware "where to watch" guide. Each URL (`/:slug`) renders
a single event or channel from Supabase, with SEO meta + JSON-LD, a live
countdown, a real connection test, and internal links to related events.

Stack: **Vite + React + React Router + Tailwind v4 + Supabase**.

## Quick start

```bash
npm install
cp .env.example .env      # then fill in the values
npm run dev
```

Apply the database schema (Supabase SQL editor or `supabase db push`):

```
supabase/schema.sql
```

It creates the `fixtures` table, a public **read-only** RLS policy, and a few
upcoming seed rows so the UI renders immediately. Visit e.g.
`/mexico-vs-usa-2026`.

## Environment variables

| Var | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon key (safe in the browser **with RLS on**) |
| `VITE_BRAND_NAME` | Brand shown in titles/footer |
| `VITE_CTA_BASE` | Base of the outbound CTA (e.g. `https://wa.me/4474…`) |
| `VITE_CTA_MESSAGE_TEMPLATE` | Prefilled message; `{event}` is replaced |
| `VITE_LATENCY_TEST_URL` | URL to time round-trips against (default: same-origin) |
| `VITE_SITE_ORIGIN` | Canonical origin for `<link rel=canonical>` / JSON-LD |

> **Only `VITE_`-prefixed vars reach the browser.** Your `OPENROUTER_API_KEY`
> is a server secret — do **not** prefix it with `VITE_` and never call
> OpenRouter from the client, or the key ships to every visitor. If you want AI
> content generation, do it in a Supabase Edge Function and write the result
> into `content_cache`.

## Project structure

```
src/
  lib/supabase.js          Supabase client (+ "configured?" guard)
  config/site.js           Env-driven site config (brand, CTA, network test)
  utils/
    categories.js          category → theme + JSON-LD type + sport
    seo.js                 buildMeta() + buildJsonLd() (SportsEvent / BroadcastService)
    cta.js                 buildCtaLink() — templates event title into CTA
    format.js              locale-aware date/time
  hooks/
    useFixture.js          fetch one fixture by slug
    useRelatedFixtures.js  4 upcoming in the same category
    useCountdown.js        countdown + LIVE / ended state
    useNetworkTest.js      real latency + bandwidth measurement
  components/              Seo, EventHeader, CountdownTimer, NetworkTest,
                          BroadcasterInfo, RelatedFixtures, CtaButton, SiteFooter
  pages/                   HomePage, EventPage (/:slug), NotFound
```

## How the moving parts behave

- **Category theming** — `category` selects an accent colour (injected as a CSS
  variable so every `*-accent` utility re-themes) and the JSON-LD shape:
  `SportsEvent` for matches, `BroadcastService` for `TV-Channels`.
- **JSON-LD points at the *official* broadcaster** (the `broadcaster` field),
  not at the CTA link — so structured "where to watch" data stays accurate.
- **The connection test is real.** It times actual round-trips and reads the
  Network Information API, then reports honest numbers and a rating. It does not
  fabricate a "servers overloaded" verdict — a faked diagnostic is both
  deceptive and a fast way to get a domain penalised. Where a browser can't
  provide bandwidth (Safari/Firefox), it says "unavailable" instead of guessing.
- **CTA** — `VITE_CTA_BASE` + a templated message. Keep the template honest and
  point the link at a service you're licensed/authorised to provide.

## SEO / prerendering (important)

Meta + JSON-LD are injected client-side via `react-helmet-async`. Googlebot
renders JS and will see them, but for reliable indexing across all crawlers and
faster first paint you should **serve prerendered HTML**:

- Netlify: enable prerendering, or add `@netlify/plugin-…` / a prerender service.
- Or prerender at build with a tool like `vite-react-ssg` / `react-snap`.
- Generate a `sitemap.xml` from the `fixtures` slugs (a small build script or an
  Edge Function) and reference it in `public/robots.txt`.

`public/_redirects` already routes all paths to `index.html` for SPA routing on
Netlify.

## Note on content & rights

This renders whatever is in your `fixtures` table. To stay on the right side of
both the law and search policies, make sure the `broadcaster` values and the CTA
destination refer to broadcasters/services you are licensed to point users to in
the relevant region. The footer carries a standing "check your local official
broadcaster" notice for the same reason.
