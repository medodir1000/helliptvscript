// ===========================================================================
// rights-map.js — OFFICIAL broadcast rights for major competitions, by region.
//
// ⚠️  Broadcast rights are sold in multi-year cycles and CHANGE every few
//     seasons. This is a STARTER map of real, current rights holders — you MUST
//     verify it against official sources before production and refresh it each
//     season. Where there is no single global broadcaster, INTL is null on
//     purpose (the app then shows "to be confirmed" rather than a wrong claim).
//
// Region codes: GB (UK & Ireland), US, CA, AU, ES, MENA, SSA (sub-Saharan
// Africa), IN (India), INTL (global product / fallback).
// ===========================================================================

export const RIGHTS_LAST_VERIFIED = '2026-06-16'

export const RIGHTS = {
  'Premier League': {
    GB: 'Sky Sports, TNT Sports',
    US: 'NBC Sports, Peacock',
    CA: 'Fubo',
    AU: 'Optus Sport',
    MENA: 'beIN Sports',
    SSA: 'SuperSport',
    IN: 'Star Sports, Disney+ Hotstar',
    INTL: null,
  },
  'Champions League': {
    GB: 'TNT Sports, Amazon Prime Video',
    US: 'Paramount+, CBS Sports',
    CA: 'DAZN',
    AU: 'Stan Sport',
    MENA: 'beIN Sports',
    IN: 'Sony Sports Network',
    INTL: null,
  },
  'La Liga': {
    ES: 'Movistar Plus+, DAZN',
    GB: 'Premier Sports',
    US: 'ESPN+',
    MENA: 'beIN Sports',
    AU: 'beIN Sports (via Kayo)',
    INTL: null,
  },
  NBA: {
    US: 'ESPN/ABC, NBC, Amazon Prime Video', // 2025/26 cycle onward (TNT out)
    GB: 'Sky Sports',
    CA: 'TSN, Sportsnet',
    AU: 'ESPN (via Kayo)',
    MENA: 'beIN Sports',
    INTL: 'NBA League Pass', // genuine worldwide product
  },
  'World Cup': {
    US: 'FOX, Telemundo',
    GB: 'BBC, ITV',
    CA: 'TSN, CTV',
    MENA: 'beIN Sports',
    AU: 'Optus Sport',
    INTL: 'FOX, Telemundo', // 2026 is US/CA/MX-hosted; rights are per-territory
  },
  WNBA: {
    US: 'ESPN, ABC, CBS, ION',
    INTL: 'WNBA League Pass',
  },
}

/**
 * Resolve a single broadcaster string for a competition + region.
 * Fallback order: requested region → INTL → null.
 * null means "we don't have a verified rights holder" — the app renders that as
 * "to be confirmed", which is honest. Never returns a guess.
 */
export function resolveBroadcaster(competition, region = 'INTL') {
  const comp = RIGHTS[competition]
  if (!comp) return null
  return comp[region] ?? comp.INTL ?? null
}

/** Full per-region object for a competition (use for render-time geo resolution). */
export function broadcastersByRegion(competition) {
  return RIGHTS[competition] ?? null
}
