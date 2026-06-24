// ===========================================================================
// Supabase Edge Function: sitemap
// Serves a live sitemap.xml built from the current `fixtures` rows, so it
// always reflects the latest fixtures with no rebuild/redeploy of the site.
//
// Public on purpose (search engines fetch it with no auth) — deployed with
// verify_jwt=false. Reads via the auto-injected service-role key (server-side).
//
// Fronted at https://live.helliptv.com/sitemap.xml via the Netlify proxy in
// public/_redirects (a sitemap must live on the same host as its URLs).
// ===========================================================================
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const ORIGIN = (Deno.env.get('SITE_ORIGIN') ?? 'https://live.helliptv.com').replace(/\/$/, '')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
// Service-role is server-side only here (never exposed) and bypasses RLS, so the
// read returns every fixture regardless of anon/publishable key migrations.
const READ_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!
const MAX = 45000 // single-file sitemap limit is 50k; stay comfortably under

const escapeXml = (s: string): string =>
  s.replace(
    /[&<>'"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;' })[c]!,
  )

Deno.serve(async () => {
  const today = new Date().toISOString().slice(0, 10)

  let rows: { slug: string }[] = []
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/fixtures?select=slug&order=date_time.desc&limit=${MAX}`,
      {
        headers: {
          apikey: READ_KEY,
          Authorization: `Bearer ${READ_KEY}`,
          // This project's PostgREST exposes the `api` schema by default; ask for `public`.
          'Accept-Profile': 'public',
        },
      },
    )
    if (res.ok) rows = await res.json()
  } catch (_e) {
    rows = [] // degrade to the homepage-only sitemap rather than erroring
  }

  const urls = [
    { loc: `${ORIGIN}/`, freq: 'hourly' },
    ...rows.map((r) => ({ loc: `${ORIGIN}/${r.slug}`, freq: 'daily' })),
  ]

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n  </url>`,
      )
      .join('\n') +
    `\n</urlset>\n`

  // Explicit Headers() so the platform preserves the XML content type.
  const headers = new Headers()
  headers.set('Content-Type', 'application/xml; charset=utf-8')
  headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  headers.set('Access-Control-Allow-Origin', '*')
  return new Response(body, { headers })
})
