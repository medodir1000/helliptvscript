import { buildCtaLink } from '../utils/cta.js'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

// Fire-and-forget conversion logging (surfaced in the /admin dashboard).
function logCtaClick(eventTitle, href) {
  if (!isSupabaseConfigured) return
  supabase
    .from('cta_clicks')
    .insert({ event_title: eventTitle || null, href: href || null })
    .then(
      () => {},
      () => {},
    )
}

/**
 * Outbound CTA. The destination is operator-configured (VITE_CTA_BASE); the
 * event title is templated into the prefilled message. Opens in a new tab with
 * rel="noopener" for safety.
 */
export default function CtaButton({ eventTitle, children, className = '', variant = 'solid' }) {
  const href = buildCtaLink(eventTitle)

  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft'
  const styles =
    variant === 'solid'
      ? 'bg-accent text-fg hover:brightness-110 shadow-lg shadow-accent/25'
      : 'border border-accent/40 text-accent-soft hover:bg-accent/10'

  if (!href) {
    return (
      <span
        className={`${base} cursor-not-allowed bg-ink-700 text-muted ${className}`}
        title="Set VITE_CTA_BASE to enable this link"
      >
        {children || 'Contact support'}
      </span>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => logCtaClick(eventTitle, href)}
      className={`${base} ${styles} ${className}`}
    >
      {children || 'Get help watching this event'}
    </a>
  )
}
