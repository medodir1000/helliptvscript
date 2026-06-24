// ===========================================================================
// fetch-fixtures.js — accurate fixtures ingest for the broadcaster guide.
//
// Source : TheSportsDB (free tier, `eventsday` endpoint) — real schedules.
//          eventsday is UNCAPPED on the free key (eventsseason caps at 5 and
//          eventsnextleague is paid), so it returns whatever is actually on
//          across the next N days. Off-season leagues are simply skipped.
// Writes : Supabase `fixtures` (upsert, idempotent on slug) + IndexNow ping.
// Run    : `node scripts/fetch-fixtures.js`  (Node 18+; has global fetch)
//
// Env:
//   VITE_SUPABASE_URL          (shared with the frontend)
//   SUPABASE_SERVICE_ROLE_KEY  REQUIRED for writes — anon is read-only (RLS).
//   THESPORTSDB_API_KEY        optional (default '3', the public test key)
//   DEFAULT_REGION             broadcaster region (default 'INTL')
//   INGEST_DAYS_AHEAD          days of schedule to scan (default 14)
//   SITE_ORIGIN                public origin for page URLs
//   INDEXNOW_KEY               IndexNow key; new pages are submitted on upsert
//   INGEST_INTERVAL_MS         optional; >0 turns the script into a loop
// ===========================================================================

try {
  await import('dotenv/config')
} catch {
  /* dotenv not installed — fine in production */
}

import { createClient } from '@supabase/supabase-js'
import { pathToFileURL } from 'node:url'
import { resolveBroadcaster, RIGHTS_LAST_VERIFIED } from './rights-map.js'
import { submitUrls } from './indexnow.js'

const DEFAULT_REGION = process.env.DEFAULT_REGION || 'INTL'

// Site + IndexNow config (IndexNow notifies Bing/Yandex/Seznam of NEW pages).
const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://blog.helliptv.com').replace(/\/$/, '')
const SITE_HOST = (() => {
  try {
    return new URL(SITE_ORIGIN).host
  } catch {
    return ''
  }
})()
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || ''
const INDEXNOW_KEY_LOCATION =
  process.env.INDEXNOW_KEY_LOCATION ||
  (INDEXNOW_KEY ? `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt` : undefined)

// --- TheSportsDB data source ----------------------------------------------
const TSDB_KEY = process.env.THESPORTSDB_API_KEY || '3' // '3' = public test key
const TSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${TSDB_KEY}`
const DAYS_AHEAD = Number(process.env.INGEST_DAYS_AHEAD || 14)

// Leagues to ingest, keyed by TheSportsDB idLeague. Add ids here to expand
// coverage (verify ids via <base>/all_leagues.php).
const LEAGUES = {
  4429: { competition: 'World Cup', category: 'Football' },
  4328: { competition: 'Premier League', category: 'Football' },
  4335: { competition: 'La Liga', category: 'Football' },
  4480: { competition: 'Champions League', category: 'Football' },
  4387: { competition: 'NBA', category: 'Basketball' },
  4516: { competition: 'WNBA', category: 'Basketball' },
}
// eventsday is grouped by sport; query the sports our leagues use.
const SPORTS = ['Soccer', 'Basketball']

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJson(url, timeoutMs = 12000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'helliptv-fixtures/1.0 (+https://live.helliptv.com)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

/** Build a UTC ISO timestamp from TheSportsDB fields (their times are UTC). */
export function toISO(ev) {
  const raw =
    ev.strTimestamp ||
    (ev.dateEvent
      ? `${ev.dateEvent}T${ev.strTime && /^\d\d:\d\d/.test(ev.strTime) ? ev.strTime.slice(0, 8) : '00:00:00'}`
      : null)
  if (!raw) return null
  const hasZone = /[zZ]$|[+-]\d\d:?\d\d$/.test(raw)
  const d = new Date(hasZone ? raw : `${raw}Z`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function titleFor(ev) {
  if (ev.strEvent && /\bvs?\b/i.test(ev.strEvent)) return ev.strEvent.trim()
  if (ev.strHomeTeam && ev.strAwayTeam) return `${ev.strHomeTeam} vs ${ev.strAwayTeam}`
  return (ev.strEvent || '').trim()
}

/** Skip placeholder fixtures ("Group A Winner vs ...", TBD, 3rd-place, etc.). */
export function isRealMatch(strEvent) {
  const s = String(strEvent || '')
  return / vs /i.test(s) && !/winner|runner|tbd|place|group [a-z] |best /i.test(s)
}

/**
 * Real, upcoming fixtures for the configured leagues, scanned day-by-day via
 * the uncapped eventsday endpoint. Network-only — safe to import and test.
 */
export async function fetchUpcomingFixtures() {
  const now = Date.now()
  const seen = new Map() // idEvent → fixture (dedupe)

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = new Date(now + i * 86400000).toISOString().slice(0, 10)
    for (const sport of SPORTS) {
      try {
        const data = await getJson(`${TSDB_BASE}/eventsday.php?d=${day}&s=${sport}`)
        const events = Array.isArray(data?.events) ? data.events : []
        for (const ev of events) {
          const league = LEAGUES[ev.idLeague]
          if (!league || !isRealMatch(ev.strEvent)) continue
          const startsAt = toISO(ev)
          const title = titleFor(ev)
          if (!startsAt || !title) continue
          if (new Date(startsAt).getTime() < now) continue // upcoming only
          if (seen.has(ev.idEvent)) continue
          seen.set(ev.idEvent, {
            title,
            startsAt,
            competition: league.competition,
            category: league.category,
            language: 'en',
            eventRef: ev.idEvent, // for live-score lookup at render time
          })
        }
      } catch (err) {
        // one day/sport failing (timeout, rate-limit) must not abort the rest
        console.error(`[tsdb] ${day} ${sport} failed: ${err.message}`)
      }
      await sleep(250) // be gentle on the free-tier rate limit
    }
  }

  const out = [...seen.values()].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
  console.log(`[tsdb] ${out.length} upcoming fixtures across the next ${DAYS_AHEAD} days`)
  return out
}

// --- slug ------------------------------------------------------------------
export function slugify(title, startsAt) {
  const base = String(title)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return `${base}-${new Date(startsAt).toISOString().slice(0, 10)}` // dated => stable & unique
}

// --- Supabase write (lazy: import stays side-effect free) -------------------
let _supabase
function getSupabase() {
  if (_supabase) return _supabase
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — writes need the ' +
        'service_role key (the anon key is read-only under RLS).',
    )
  }
  _supabase = createClient(url, key, { auth: { persistSession: false } })
  return _supabase
}

/** Returns the slug if a NEW row was inserted, or null if it already existed. */
async function upsertFixture(row) {
  const { data, error } = await getSupabase()
    .from('fixtures')
    .upsert(row, { onConflict: 'slug', ignoreDuplicates: true })
    .select('slug')
  if (error) throw error
  return data?.[0]?.slug ?? null
}

// --- one run ---------------------------------------------------------------
export async function runOnce() {
  const events = await fetchUpcomingFixtures()
  const newUrls = []
  let ok = 0
  let failed = 0
  for (const e of events) {
    try {
      const insertedSlug = await upsertFixture({
        slug: slugify(e.title, e.startsAt),
        event_title: e.title,
        date_time: e.startsAt,
        category: e.category ?? null,
        competition: e.competition ?? null,
        language: e.language ?? 'en',
        broadcaster: resolveBroadcaster(e.competition, DEFAULT_REGION), // verified rights only
        event_ref: e.eventRef ?? null,
        content_cache: null, // filled via the reviewed/honest content step — not auto-spun here
      })
      ok++
      if (insertedSlug) newUrls.push(`${SITE_ORIGIN}/${insertedSlug}`)
    } catch (err) {
      failed++
      console.error('[skip]', e?.title, '—', err.message)
    }
  }
  console.log(
    `run complete: ${ok} upserted (${newUrls.length} new), ${failed} skipped ` +
      `(region=${DEFAULT_REGION}, rights verified ${RIGHTS_LAST_VERIFIED})`,
  )

  // Notify search engines about the NEW pages only — batched. Best-effort.
  if (newUrls.length && INDEXNOW_KEY) {
    const result = await submitUrls(newUrls, {
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_LOCATION,
    })
    console.log('[indexnow]', JSON.stringify(result))
  } else if (newUrls.length) {
    console.log('[indexnow] skipped — set INDEXNOW_KEY to enable')
  }
}

// --- lifecycle (only when run directly: `node scripts/fetch-fixtures.js`) ---
const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href
if (isMain) {
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Writes need the service_role key — the anon key is read-only under RLS.',
    )
    process.exit(1)
  }
  const INTERVAL_MS = Number(process.env.INGEST_INTERVAL_MS || 0)
  ;(async () => {
    await runOnce().catch((e) => console.error('[run error]', e))
    if (INTERVAL_MS > 0) {
      console.log(`looping every ${INTERVAL_MS}ms`)
      setInterval(() => runOnce().catch((e) => console.error('[run error]', e)), INTERVAL_MS)
    }
  })()
}
