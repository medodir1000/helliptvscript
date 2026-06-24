// ===========================================================================
// indexnow.js — notify search engines (Bing / Yandex / Seznam) of new or
// updated URLs via the IndexNow protocol (https://www.indexnow.org).
//
// Legitimate and terms-compliant: IndexNow is built for exactly this — telling
// engines "these real URLs changed, come crawl them". Best-effort by design:
// it never throws, so a failed ping can't break the ingest.
// ===========================================================================

const ENDPOINT = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow'

export function buildPayload(urls, { host, key, keyLocation }) {
  return {
    host,
    key,
    ...(keyLocation && { keyLocation }),
    urlList: urls.slice(0, 10000), // IndexNow accepts up to 10k URLs per request
  }
}

export async function submitUrls(urls, { host, key, keyLocation, timeoutMs = 10000 } = {}) {
  const list = (urls || []).filter(Boolean)
  if (!list.length) return { skipped: 'no urls' }
  if (!host || !key) return { skipped: 'missing host/key' }

  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(buildPayload(list, { host, key, keyLocation })),
      signal: ctrl.signal,
    })
    // 200 = received, 202 = accepted (key validation pending). Both are success.
    return {
      status: res.status,
      ok: res.status === 200 || res.status === 202,
      submitted: list.length,
    }
  } catch (err) {
    return { error: err.message } // never throw — indexing is best-effort
  } finally {
    clearTimeout(t)
  }
}
