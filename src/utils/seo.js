import { getCategoryTheme } from './categories.js'
import { site } from '../config/site.js'
import { toISO } from './format.js'

/**
 * Build the <title> and meta description for a fixture.
 * Title format: "Watch [Event] Live — Where to Watch | <Brand>"
 */
export function buildMeta(fixture) {
  const title = `Watch ${fixture.event_title} Live — Where to Watch | ${site.brand}`

  const description =
    (fixture.content_cache && stripToLength(fixture.content_cache, 155)) ||
    `${fixture.event_title}: start time, official broadcaster${
      fixture.broadcaster ? ` (${fixture.broadcaster})` : ''
    } and where to watch live. Check your connection before kickoff.`

  return { title, description }
}

export function canonicalUrl(slug) {
  return site.origin ? `${site.origin}/${slug}` : undefined
}

/**
 * Build JSON-LD structured data.
 *
 * - Live events  → SportsEvent, with the OFFICIAL broadcaster (from the
 *   `broadcaster` field) expressed as a BroadcastEvent/BroadcastService. We
 *   intentionally point structured data at the official broadcaster, not at the
 *   contact CTA, so search engines see accurate "where to watch" data.
 * - TV channels  → BroadcastService.
 */
export function buildJsonLd(fixture) {
  const theme = getCategoryTheme(fixture.category)
  const url = canonicalUrl(fixture.slug)
  const startDate = toISO(fixture.date_time)

  if (theme.schemaType === 'BroadcastService') {
    return {
      '@context': 'https://schema.org',
      '@type': 'BroadcastService',
      name: fixture.event_title,
      broadcastDisplayName: fixture.event_title,
      ...(fixture.broadcaster && {
        provider: { '@type': 'Organization', name: fixture.broadcaster },
      }),
      ...(fixture.language && { inLanguage: fixture.language }),
      areaServed: 'Worldwide',
      ...(url && { url }),
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: fixture.event_title,
    ...(startDate && { startDate }),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    ...(theme.sport && { sport: theme.sport }),
    ...(url && {
      location: { '@type': 'VirtualLocation', url },
      url,
    }),
    ...(fixture.broadcaster && {
      subjectOf: {
        '@type': 'BroadcastEvent',
        name: `${fixture.event_title} — live broadcast`,
        ...(startDate && { startDate }),
        isLiveBroadcast: true,
        publishedOn: {
          '@type': 'BroadcastService',
          name: fixture.broadcaster,
          ...(fixture.language && { inLanguage: fixture.language }),
        },
      },
    }),
  }
}

function stripToLength(text, max) {
  const clean = String(text).replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max - 1).trimEnd() + '…'
}
