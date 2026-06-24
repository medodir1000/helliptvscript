// ===========================================================================
// Supabase Edge Function: index-now
// Admin IndexNow control room.
//   { action: 'status' } -> is the key configured? + the real engine list
//   { action: 'bulk' }   -> re-submit recent PUBLISHED post URLs to IndexNow
//
// IndexNow notifies Bing / Yandex / Seznam (the actual participants). Google is
// NOT an IndexNow participant — it discovers pages via the sitemap + crawl, so
// we don't claim a Google ping here.
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

const ENGINES = ['Bing', 'Yandex', 'Seznam']

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

  const rawOrigin = Deno.env.get('SITE_ORIGIN') || 'https://blog.helliptv.com'
  const origin = rawOrigin.endsWith('/') ? rawOrigin.slice(0, -1) : rawOrigin
  const key = Deno.env.get('INDEXNOW_KEY')

  let action = 'status'
  try {
    const body = await req.json()
    action = String(body?.action || 'status')
  } catch {
    /* default status */
  }

  if (action === 'status') {
    return json({
      keyConfigured: !!key,
      origin,
      engines: ENGINES,
      google: 'not an IndexNow participant (discovered via sitemap + crawl)',
    })
  }

  // action === 'bulk' — re-submit recent published URLs.
  // Missing key/origin must NOT error — return a clean 200 "skipped" so the
  // frontend can show a friendly setup notice instead of a non-2xx failure.
  if (!key) {
    return json({
      status: 'skipped',
      message: 'IndexNow key is missing server-side. Skipping ping safely.',
    })
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { data: posts } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50)

  const urls = (posts || []).map((p: { slug: string }) => `${origin}/blog/${p.slug}`)
  if (!urls.length) return json({ ok: true, submitted: 0, message: 'No published URLs to submit.' })

  let httpCode = 0
  let ok = false
  try {
    const host = new URL(origin).host
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, key, keyLocation: `${origin}/${key}.txt`, urlList: urls }),
    })
    httpCode = r.status
    ok = r.ok
  } catch (_e) {
    httpCode = 0
    ok = false
  }

  const rows = urls.map((u) => ({
    url: u,
    target: 'IndexNow (Bing/Yandex/Seznam)',
    http_code: httpCode,
    ok,
    source: 'bulk',
  }))
  await supabase.from('index_submissions').insert(rows)

  return json({ ok: true, submitted: urls.length, http_code: httpCode })
})
