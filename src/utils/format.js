/** Locale-aware date/time helpers. `language` is the fixture's BCP-47 tag. */

export function formatDateTime(dateTime, language = 'en') {
  const date = new Date(dateTime)
  if (Number.isNaN(date.getTime())) return ''
  try {
    return new Intl.DateTimeFormat(language, {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return date.toUTCString()
  }
}

export function toISO(dateTime) {
  const date = new Date(dateTime)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

/** Short label for cards, e.g. "Sat 14 Jun, 20:00". */
export function formatShort(dateTime, language = 'en') {
  const date = new Date(dateTime)
  if (Number.isNaN(date.getTime())) return ''
  try {
    return new Intl.DateTimeFormat(language, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return date.toUTCString()
  }
}

/** Short plain-text excerpt for blog cards. */
export function excerpt(text, max = 120) {
  if (!text) return ''
  const clean = String(text).replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : clean.slice(0, max - 1).trimEnd() + '…'
}
