// ===========================================================================
// generate-sitemap.js — build public/sitemap.xml from the fixtures table.
// Run: `node scripts/generate-sitemap.js`  (or `npm run sitemap`).
// Shards into a sitemap index automatically past 45k URLs.
// ===========================================================================

try {
  await import('dotenv/config')
} catch {
  /* optional locally; Railway injects env directly */
}

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const ORIGIN = (process.env.SITE_ORIGIN || 'https://live.helliptv.com').replace(/\/$/, '')
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url))
const MAX_PER_FILE = 45000

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

async function readFixtures() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[sitemap] no Supabase env — emitting static routes only')
    return []
  }
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
    const { data, error } = await supabase
      .from('fixtures')
      .select('slug')
      .order('date_time', { ascending: false })
    if (error) throw error
    return data || []
  } catch (err) {
    console.warn('[sitemap] could not read fixtures:', err.message)
    return []
  }
}

async function main() {
  const today = new Date().toISOString().slice(0, 10)
  const fixtures = await readFixtures()

  const urls = [
    { loc: `${ORIGIN}/`, lastmod: today, changefreq: 'hourly' },
    ...fixtures.map((f) => ({ loc: `${ORIGIN}/${f.slug}`, lastmod: today })),
  ]

  if (urls.length <= MAX_PER_FILE) {
    writeFileSync(join(PUBLIC_DIR, 'sitemap.xml'), buildUrlset(urls))
    console.log(`[sitemap] wrote sitemap.xml — ${urls.length} URLs`)
  } else {
    const parts = chunk(urls, MAX_PER_FILE)
    const files = parts.map((_, i) => `sitemap-${i + 1}.xml`)
    parts.forEach((part, i) => writeFileSync(join(PUBLIC_DIR, files[i]), buildUrlset(part)))
    writeFileSync(join(PUBLIC_DIR, 'sitemap.xml'), buildIndex(files, today))
    console.log(`[sitemap] wrote index + ${files.length} shards — ${urls.length} URLs`)
  }
}

main().catch((e) => {
  console.error('[sitemap] failed:', e)
  process.exit(1)
})
