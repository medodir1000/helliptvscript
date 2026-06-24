// ===========================================================================
// generate-sitemap.js — build dist/sitemap.xml from published blog posts +
// fixtures + the static section routes.
//
// Runs as part of `npm run build` (AFTER `vite build`) so the deployed output
// contains a REAL /sitemap.xml file. On Railway the Netlify `_redirects` proxy
// does not work, so a real static file is the reliable way to serve a sitemap
// that Google can read.
//
// Reads via supabase-js (same client/schema the app uses). Degrades gracefully:
// if the DB env is missing or a query fails, it still emits the static routes
// and never fails the build.
//
// Run standalone: `npm run sitemap` (after a build, so dist/ exists).
// ===========================================================================

try {
  await import('dotenv/config')
} catch {
  /* optional locally; Railway injects env directly */
}

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const ORIGIN = (
  process.env.VITE_SITE_ORIGIN ||
  process.env.SITE_ORIGIN ||
  'https://blog.helliptv.com'
).replace(/\/$/, '')
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const OUT_DIR = fileURLToPath(new URL('../dist/', import.meta.url))
const MAX_PER_FILE = 45000

// Always-present routes (homepage, blog index, section hubs, help centre).
const STATIC_ROUTES = [
  { path: '/', changefreq: 'hourly' },
  { path: '/blog', changefreq: 'daily' },
  { path: '/matches', changefreq: 'daily' },
  { path: '/help-center', changefreq: 'weekly' },
  { path: '/football', changefreq: 'daily' },
  { path: '/movies-series', changefreq: 'daily' },
  { path: '/combat-sports', changefreq: 'daily' },
  { path: '/tennis-rugby', changefreq: 'daily' },
]

const escapeXml = (s) =>
  String(s).replace(
    /[&<>'"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;' })[c],
  )

export function buildUrlset(urls) {
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq || 'daily'}</changefreq>\n  </url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

function buildIndex(files, lastmod) {
  const body = files
    .map((f) => `  <sitemap>\n    <loc>${ORIGIN}/${f}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`
}

const chunk = (arr, n) => {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

async function readRows(supabase, table, build) {
  try {
    const { data, error } = await build(supabase.from(table))
    if (error) throw error
    return data || []
  } catch (err) {
    console.warn(`[sitemap] could not read ${table}:`, err.message)
    return []
  }
}

async function main() {
  const today = new Date().toISOString().slice(0, 10)

  let posts = []
  let fixtures = []
  if (SUPABASE_URL && SUPABASE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
    posts = await readRows(supabase, 'posts', (q) =>
      q.select('slug, published_at').eq('status', 'published').order('published_at', { ascending: false }),
    )
    fixtures = await readRows(supabase, 'fixtures', (q) =>
      q.select('slug').order('date_time', { ascending: false }),
    )
  } else {
    console.warn('[sitemap] no Supabase env — emitting static routes only')
  }

  const urls = [
    ...STATIC_ROUTES.map((r) => ({ loc: `${ORIGIN}${r.path}`, lastmod: today, changefreq: r.changefreq })),
    ...posts.map((p) => ({
      loc: `${ORIGIN}/blog/${p.slug}`,
      lastmod: (p.published_at || today).slice(0, 10),
      changefreq: 'weekly',
    })),
    ...fixtures.map((f) => ({ loc: `${ORIGIN}/${f.slug}`, lastmod: today, changefreq: 'daily' })),
  ]

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

  if (urls.length <= MAX_PER_FILE) {
    writeFileSync(join(OUT_DIR, 'sitemap.xml'), buildUrlset(urls))
    console.log(
      `[sitemap] wrote dist/sitemap.xml — ${urls.length} URLs (${posts.length} posts, ${fixtures.length} fixtures) @ ${ORIGIN}`,
    )
  } else {
    const parts = chunk(urls, MAX_PER_FILE)
    const files = parts.map((_, i) => `sitemap-${i + 1}.xml`)
    parts.forEach((part, i) => writeFileSync(join(OUT_DIR, files[i]), buildUrlset(part)))
    writeFileSync(join(OUT_DIR, 'sitemap.xml'), buildIndex(files, today))
    console.log(`[sitemap] wrote index + ${files.length} shards — ${urls.length} URLs`)
  }
}

main().catch((e) => {
  // A sitemap problem must never break the deploy — log and exit cleanly.
  console.error('[sitemap] failed (non-fatal):', e)
  process.exit(0)
})
