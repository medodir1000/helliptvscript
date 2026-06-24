// Maps broadcaster names (as stored on a fixture) to their OFFICIAL watch page,
// so the "Now on" panel and the watch CTA link out to the real rights holder —
// never to an in-page restream. Unknown names render as plain text (no link),
// not a fabricated destination.

const BROADCASTER_URLS = {
  'sky sports': 'https://www.skysports.com/watch',
  'tnt sports': 'https://www.tntsports.co.uk/',
  'bein sports': 'https://www.beinsports.com/',
  bein: 'https://www.beinsports.com/',
  'espn+': 'https://plus.espn.com/',
  espn: 'https://www.espn.com/watch/',
  'espn/abc': 'https://www.espn.com/watch/',
  'nbc sports': 'https://www.nbcsports.com/',
  peacock: 'https://www.peacocktv.com/',
  dazn: 'https://www.dazn.com/',
  'paramount+': 'https://www.paramountplus.com/',
  'cbs sports': 'https://www.cbssports.com/',
  'optus sport': 'https://sport.optus.com.au/',
  'stan sport': 'https://www.stan.com.au/sport',
  fubo: 'https://www.fubo.tv/',
  'movistar plus+': 'https://www.movistarplus.es/',
  'premier sports': 'https://www.premiersports.com/',
  supersport: 'https://www.supersport.com/',
  'sony sports network': 'https://www.sonyliv.com/',
  'star sports': 'https://www.hotstar.com/',
  'disney+ hotstar': 'https://www.hotstar.com/',
  tsn: 'https://www.tsn.ca/',
  sportsnet: 'https://www.sportsnet.ca/',
  'nba league pass': 'https://www.nba.com/watch',
  'amazon prime video': 'https://www.primevideo.com/',
  telemundo: 'https://www.telemundo.com/deportes',
  fox: 'https://www.foxsports.com/live',
  'fox sports': 'https://www.foxsports.com/live',
  bbc: 'https://www.bbc.co.uk/iplayer',
  itv: 'https://www.itv.com/watch',
  ctv: 'https://www.ctv.ca/',
}

function normalise(name) {
  return String(name)
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // drop "(via Kayo)" etc.
    .replace(/\s+/g, ' ')
    .trim()
}

/** "Sky Sports, TNT Sports and beIN" → ["Sky Sports", "TNT Sports", "beIN"] */
export function splitBroadcasters(value) {
  if (!value) return []
  return String(value)
    .split(/\s*,\s*|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function urlFor(name) {
  const key = normalise(name)
  if (BROADCASTER_URLS[key]) return BROADCASTER_URLS[key]
  const hit = Object.keys(BROADCASTER_URLS).find(
    (k) => key.startsWith(k) || k.startsWith(key),
  )
  return hit ? BROADCASTER_URLS[hit] : null
}

/** [{ name, url|null }] for each broadcaster on a fixture. */
export function watchLinksFor(value) {
  return splitBroadcasters(value).map((name) => ({ name, url: urlFor(name) }))
}
