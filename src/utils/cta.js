import { site } from '../config/site.js'

/**
 * Build the outbound CTA link for an event.
 *
 * The destination is operator-configured (VITE_CTA_BASE). We only template the
 * event title into the prefilled message — we do not fabricate claims or inject
 * marketing copy here; keep VITE_CTA_MESSAGE_TEMPLATE honest.
 *
 * Supports wa.me / api.whatsapp.com (uses ?text=) and generic URLs (?msg=).
 */
export function buildCtaLink(eventTitle = '') {
  const base = site.cta.base
  const message = site.cta.messageTemplate.replace('{event}', eventTitle).trim()

  if (!base) return null

  const encoded = encodeURIComponent(message)
  const isWhatsApp = /wa\.me|whatsapp\.com/i.test(base)
  const param = isWhatsApp ? 'text' : 'msg'
  const sep = base.includes('?') ? '&' : '?'

  return `${base}${sep}${param}=${encoded}`
}
