import { Link } from 'react-router-dom'
import { formatShort } from '../utils/format.js'

/**
 * Compressed, auto-scrolling strip of upcoming fixtures. CSS-only marquee
 * (transform animation, pauses on hover, respects reduced-motion).
 */
export default function FixturesMarquee({ fixtures }) {
  if (!fixtures?.length) return null
  // Two identical copies → seamless -50% loop.
  const items = [...fixtures, ...fixtures]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface/70 py-2.5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-canvas to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-canvas to-transparent" />
      <div className="marquee-track flex w-max items-center gap-2.5 px-3">
        {items.map((f, i) => (
          <Link
            key={`${f.slug}-${i}`}
            to={`/${f.slug}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs transition hover:border-accent/40"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
            <span className="font-semibold text-fg">{f.event_title}</span>
            <span className="text-faint">{formatShort(f.date_time, f.language)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
