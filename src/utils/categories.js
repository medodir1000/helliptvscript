/**
 * Category → theme + semantics map.
 *
 * `accent` / `accentSoft` are injected as CSS variables on the page wrapper,
 * so all `*-accent` Tailwind utilities re-theme automatically. `schemaType`
 * drives which JSON-LD shape we emit (see utils/seo.js). `sport` is used for
 * the schema.org `sport` field on live matches.
 */
const THEMES = {
  football: {
    key: 'football',
    label: 'Football',
    accent: '#22c55e',
    accentSoft: '#86efac',
    sport: 'Soccer',
    schemaType: 'SportsEvent',
    blurb: 'Kickoff times and official broadcasters.',
  },
  boxing: {
    key: 'boxing',
    label: 'Boxing',
    accent: '#ef4444',
    accentSoft: '#fca5a5',
    sport: 'Boxing',
    schemaType: 'SportsEvent',
    blurb: 'Fight card, main-event walk-in times and where to watch.',
  },
  combat: {
    key: 'combat',
    label: 'Combat Sports',
    accent: '#f97316',
    accentSoft: '#fdba74',
    sport: 'MartialArts',
    schemaType: 'SportsEvent',
    blurb: 'Card order, start times and official broadcasters.',
  },
  basketball: {
    key: 'basketball',
    label: 'Basketball',
    accent: '#fb923c',
    accentSoft: '#fed7aa',
    sport: 'Basketball',
    schemaType: 'SportsEvent',
    blurb: 'Tip-off times and where to watch.',
  },
  motorsport: {
    key: 'motorsport',
    label: 'Motorsport',
    accent: '#06b6d4',
    accentSoft: '#67e8f9',
    sport: 'AutoRacing',
    schemaType: 'SportsEvent',
    blurb: 'Lights-out times and broadcast options.',
  },
  movies: {
    key: 'movies',
    label: 'Movies',
    accent: '#e11d48',
    accentSoft: '#fb7185',
    sport: null,
    schemaType: 'Article',
    blurb: 'New releases and where to stream them.',
  },
  series: {
    key: 'series',
    label: 'Series',
    accent: '#8b5cf6',
    accentSoft: '#c4b5fd',
    sport: null,
    schemaType: 'Article',
    blurb: 'Trending shows and streaming guides.',
  },
  entertainment: {
    key: 'entertainment',
    label: 'Entertainment',
    accent: '#d946ef',
    accentSoft: '#f0abfc',
    sport: null,
    schemaType: 'Article',
    blurb: 'Movies, series and streaming guides.',
  },
  tennis: {
    key: 'tennis',
    label: 'Tennis',
    accent: '#65a30d',
    accentSoft: '#bef264',
    sport: 'Tennis',
    schemaType: 'SportsEvent',
    blurb: 'Order of play and where to watch.',
  },
  rugby: {
    key: 'rugby',
    label: 'Rugby',
    accent: '#0ea5e9',
    accentSoft: '#7dd3fc',
    sport: 'RugbyUnion',
    schemaType: 'SportsEvent',
    blurb: 'Kickoff times and broadcasters.',
  },
  ufc: {
    key: 'ufc',
    label: 'UFC',
    accent: '#dc2626',
    accentSoft: '#fca5a5',
    sport: 'MartialArts',
    schemaType: 'SportsEvent',
    blurb: 'Fight card order and main-event times.',
  },
  'tv-channels': {
    key: 'tv-channels',
    label: 'TV Channels',
    accent: '#7c3aed',
    accentSoft: '#c4b5fd',
    sport: null,
    schemaType: 'BroadcastService',
    blurb: 'Channel guide and streaming availability.',
  },
}

const DEFAULT_THEME = {
  key: 'default',
  label: 'Live Event',
  accent: '#7c3aed',
  accentSoft: '#c4b5fd',
  sport: null,
  schemaType: 'SportsEvent',
  blurb: 'Start times and where to watch.',
}

/** Normalise free-text categories ("TV Channels", "tv_channels") to a key. */
export function normaliseCategory(category) {
  return String(category || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
}

export function getCategoryTheme(category) {
  const key = normaliseCategory(category)
  return THEMES[key] || DEFAULT_THEME
}

/** Inline style object that re-themes all `*-accent` utilities downstream. */
export function themeVars(theme) {
  return {
    '--color-accent': theme.accent,
    '--color-accent-soft': theme.accentSoft,
  }
}
