// ===========================================================================
// Supabase Edge Function: suggest-topics
// Derives article-topic suggestions from YOUR OWN upcoming fixtures (no news
// scraping) and saves the new ones into suggested_topics (de-duplicated).
//
// This is the legitimate 'ingest proposes, human approves' tool: the admin sees
// the suggestions, picks one, generates a DRAFT, reviews, and publishes.
//
// Auth: verify_jwt=false (CORS preflight) + in-function getUser() (admin only).
// ===========================================================================
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type, x-supabase-api-version'
const corsFor = (req: Request) => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': req.headers.get('Access-Control-Request-Headers') ?? ALLOW_HEADERS,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
})

Deno.serve(async (req: Request) => {
  const cors = corsFor(req)
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Admin-only.
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const { data: userData, error: authErr } = await createClient(url, anonKey).auth.getUser(token)
  if (authErr || !userData?.user) return json({ error: 'Unauthorized - admin sign-in required' }, 401)

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  // Upcoming fixtures = your own real data.
  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('event_title, category, competition')
    .gte('date_time', new Date().toISOString())
    .order('date_time', { ascending: true })
    .limit(40)

  // Rotate title styles so suggestions don't share a repetitive footprint.
  const TITLE_FORMATS = [
    (t: string) => `${t}: Complete Live Coverage, Kickoff Time & Form Analysis`,
    (t: string) => `How to Stream ${t} Live Tonight Without Cable`,
    (t: string) => `${t} Broadcast Guide: TV Channels & Official Live Options`,
    (t: string) => `${t}: Full Streaming Guide & Where to Watch Live`,
  ]

  // Evergreen, multi-category topic ideas — your own editorial list, NOT scraped.
  // Honest by design: official apps / legal streaming, never piracy setups.
  const EVERGREEN: { title: string; category: string }[] = [
    { title: 'New movies streaming this week and where to watch them legally', category: 'movies' },
    { title: 'The best new series right now and which platform streams them', category: 'series' },
    { title: 'New on Netflix, Disney+ and Prime Video this month', category: 'entertainment' },
    { title: 'How to watch live sport on a Smart TV using official apps', category: 'entertainment' },
    { title: 'Fire TV vs Roku vs Apple TV: the best device for live streaming', category: 'entertainment' },
    { title: 'How to find the official broadcaster for any match in your country', category: 'entertainment' },
    { title: 'The cheapest legal ways to watch live sport without cable', category: 'entertainment' },
    { title: 'How to watch the next big boxing fight on official platforms', category: 'boxing' },
    { title: 'UFC fight nights: where to stream them legally', category: 'ufc' },
    { title: 'Where to watch the Grand Slam tennis tournaments live', category: 'tennis' },
    { title: 'Rugby on TV: how to follow the season on official broadcasters', category: 'rugby' },
  ]

  const candidates = [
    ...(fixtures || []).map(
      (f: { event_title: string; category: string | null }, i: number) => ({
        title: TITLE_FORMATS[i % TITLE_FORMATS.length](f.event_title),
        source: 'fixtures',
        category: (f.category || 'football').toLowerCase(),
      }),
    ),
    ...EVERGREEN.map((e) => ({ title: e.title, source: 'evergreen', category: e.category })),
  ]

  // De-duplicate against existing suggestions (and within this batch).
  const { data: existing } = await supabase.from('suggested_topics').select('title')
  const seen = new Set((existing || []).map((e: { title: string }) => e.title.toLowerCase()))
  const fresh: typeof candidates = []
  for (const c of candidates) {
    const k = c.title.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    fresh.push(c)
  }

  let inserted = 0
  if (fresh.length) {
    const { data, error } = await supabase.from('suggested_topics').insert(fresh).select('id')
    if (error) return json({ error: error.message }, 500)
    inserted = data?.length ?? 0
  }

  return json({ ok: true, scanned: candidates.length, inserted })
})
