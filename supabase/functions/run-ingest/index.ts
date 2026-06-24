// ===========================================================================
// Supabase Edge Function: run-ingest
// Admin-triggered fixtures ingest (same logic as scripts/fetch-fixtures.js).
//
// Auth: deployed with verify_jwt=false so the browser CORS preflight (OPTIONS,
// which carries no Authorization header) is NOT rejected by the platform. We
// authenticate inside the function by validating the caller's access token with
// auth.getUser() — only a signed-in user may run an ingest.
//
// Body (optional): { "leagues": ["World Cup", "La Liga", ...] } scopes the run.
// ===========================================================================
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Echo the browser's requested headers so the CORS preflight always passes —
// supabase-js sends x-client-info / x-supabase-api-version beyond the basics.
const ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type, x-supabase-api-version'
const corsFor = (req: Request) => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': req.headers.get('Access-Control-Request-Headers') ?? ALLOW_HEADERS,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
})

const TSDB = 'https://www.thesportsdb.com/api/v1/json/3'
const DAYS = 10
const LEAGUES: Record<string, { competition: string; category: string }> = {
  '4429': { competition: 'World Cup', category: 'Football' },
  '4328': { competition: 'Premier League', category: 'Football' },
  '4335': { competition: 'La Liga', category: 'Football' },
  '4480': { competition: 'Champions League', category: 'Football' },
  '4387': { competition: 'NBA', category: 'Basketball' },
  '4516': { competition: 'WNBA', category: 'Basketball' },
}
const SPORTS = ['Soccer', 'Basketball']

const isRealMatch = (s: string) =>
  / vs /i.test(s) && !/winner|runner|tbd|place|group [a-z] |best /i.test(s)

function toISO(ev: any): string | null {
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

const titleFor = (ev: any) =>
  (ev.strEvent && ev.strEvent.trim()) ||
  (ev.strHomeTeam && ev.strAwayTeam ? `${ev.strHomeTeam} vs ${ev.strAwayTeam}` : '')

function slugify(title: string, startsAt: string) {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return `${base}-${new Date(startsAt).toISOString().slice(0, 10)}`
}

Deno.serve(async (req: Request) => {
  const cors = corsFor(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Authenticate the caller — must be a signed-in user (validated, not just decoded).
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const { data: userData, error: authErr } = await createClient(url, anonKey).auth.getUser(token)
  if (authErr || !userData?.user) return json({ error: 'Unauthorized - admin sign-in required' }, 401)

  // Optional league scoping from the request body.
  let wanted: Set<string> | null = null
  try {
    const body = await req.json()
    if (Array.isArray(body?.leagues) && body.leagues.length) wanted = new Set(body.leagues)
  } catch {
    /* no body — ingest all */
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const now = Date.now()
  const seen = new Map<string, any>()
  for (let i = 0; i < DAYS; i++) {
    const day = new Date(now + i * 86400000).toISOString().slice(0, 10)
    for (const sport of SPORTS) {
      try {
        const r = await fetch(`${TSDB}/eventsday.php?d=${day}&s=${sport}`)
        const data = await r.json()
        for (const ev of data?.events ?? []) {
          const league = LEAGUES[ev.idLeague]
          if (!league) continue
          if (wanted && !wanted.has(league.competition)) continue
          if (!isRealMatch(ev.strEvent ?? '')) continue
          const startsAt = toISO(ev)
          const title = titleFor(ev)
          if (!startsAt || !title || new Date(startsAt).getTime() < now) continue
          if (seen.has(ev.idEvent)) continue
          seen.set(ev.idEvent, {
            slug: slugify(title, startsAt),
            event_title: title,
            date_time: startsAt,
            category: league.category,
            competition: league.competition,
            language: 'en',
            broadcaster: league.competition === 'World Cup' ? 'FOX, Telemundo' : null,
            event_ref: ev.idEvent,
            content_cache: null,
          })
        }
      } catch (_e) {
        /* skip day */
      }
      await new Promise((res) => setTimeout(res, 200))
    }
  }

  const rows = [...seen.values()]
  let upserted = 0
  let status = 'ok'
  let message: string | null = null
  if (rows.length) {
    const { data, error } = await supabase
      .from('fixtures')
      .upsert(rows, { onConflict: 'slug', ignoreDuplicates: true })
      .select('slug')
    if (error) {
      status = 'error'
      message = error.message
    } else {
      upserted = data?.length ?? 0
    }
  }

  // Record the run in the automation-logs table (best-effort).
  try {
    await supabase.from('ingest_runs').insert({
      source: 'admin',
      leagues: wanted ? [...wanted] : null,
      scanned: rows.length,
      upserted,
      status,
      message,
    })
  } catch (_e) {
    /* ignore logging failure */
  }

  if (status === 'error') return json({ error: message }, 500)
  return json({ scanned: rows.length, upserted, leagues: wanted ? [...wanted] : 'all' })
})
