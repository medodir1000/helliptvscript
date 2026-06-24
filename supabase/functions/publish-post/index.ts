// ===========================================================================
// Supabase Edge Function: publish-post
// Admin approves a draft → flip status to 'published', stamp published_at, and
// ping IndexNow (Bing / Yandex / Seznam) with the final URL for instant,
// protocol-sanctioned discovery.
//
// We deliberately DO NOT call the Google Indexing API: that API is limited to
// JobPosting and BroadcastEvent (livestream) pages — using it for articles
// violates Google's terms and risks a Service Account ban. Google discovers
// these pages via the sitemap + normal crawl (the IndexNow ping also helps).
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

  let id = ''
  try {
    const body = await req.json()
    id = String(body?.id || '')
  } catch {
    /* no body */
  }
  if (!id) return json({ error: 'A post id is required.' }, 400)

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: post } = await supabase.from('posts').select('slug, status').eq('id', id).maybeSingle()
  if (!post) return json({ error: 'Post not found.' }, 404)

  const { error: upErr } = await supabase
    .from('posts')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
  if (upErr) return json({ error: upErr.message }, 500)

  const rawOrigin = Deno.env.get('SITE_ORIGIN') || 'https://blog.helliptv.com'
  const origin = rawOrigin.endsWith('/') ? rawOrigin.slice(0, -1) : rawOrigin
  const postUrl = `${origin}/blog/${post.slug}`

  // IndexNow ping (Bing/Yandex/Seznam) — respects the admin auto-ping toggle.
  let indexnow = 'skipped (set INDEXNOW_KEY to enable)'
  const key = Deno.env.get('INDEXNOW_KEY')
  const { data: settings } = await supabase
    .from('index_settings')
    .select('auto_ping')
    .eq('id', 1)
    .maybeSingle()
  const autoPing = settings?.auto_ping !== false

  if (!autoPing) {
    indexnow = 'skipped (auto-ping is OFF)'
  } else if (key) {
    let httpCode = 0
    let ok = false
    try {
      const host = new URL(origin).host
      const r = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          key,
          keyLocation: `${origin}/${key}.txt`,
          urlList: [postUrl],
        }),
      })
      httpCode = r.status
      ok = r.ok
      indexnow = `submitted (HTTP ${r.status})`
    } catch (e) {
      indexnow = `failed: ${e instanceof Error ? e.message : String(e)}`
    }
    try {
      await supabase.from('index_submissions').insert({
        url: postUrl,
        target: 'IndexNow (Bing/Yandex/Seznam)',
        http_code: httpCode,
        ok,
        source: 'publish',
      })
    } catch (_e) {
      /* ignore log failure */
    }
  }

  return json({
    ok: true,
    url: postUrl,
    indexnow,
    google: 'discovered via sitemap + crawl (Indexing API not used for articles)',
  })
})
