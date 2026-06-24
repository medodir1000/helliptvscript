import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import EventCover from './EventCover.jsx'
import { getCategoryTheme, themeVars } from '../utils/categories.js'
import { formatShort, excerpt } from '../utils/format.js'
import { useCountdown } from '../hooks/useCountdown.js'

const SPRING = { type: 'spring', stiffness: 300, damping: 22 }

function excerptFor(f) {
  return (
    excerpt(f.content_cache) ||
    `Start time, official broadcaster${
      f.broadcaster ? ` (${f.broadcaster})` : ''
    } and where to watch ${f.event_title} live.`
  )
}

const pad = (n) => String(n).padStart(2, '0')

/** Live status / countdown pill for a fixture. */
function Countdown({ target }) {
  const { parts, isLive, isFinished, valid } = useCountdown(target)
  if (!valid) return null
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-red-300">
        <span className="animate-live h-1.5 w-1.5 rounded-full bg-red-500" />
        Live
      </span>
    )
  }
  if (isFinished) {
    return (
      <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-faint">
        Finished
      </span>
    )
  }
  const { days, hours, minutes, seconds } = parts
  return (
    <span className="font-mono text-xs tabular-nums text-neon-soft" aria-label="Time until kickoff">
      {days > 0 ? `${days}d ` : ''}
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  )
}

/**
 * Shared fixture card. Glassmorphic panel with a floating hover micro-interaction.
 * Pass `countdown` to show a live status / kickoff countdown pill.
 */
export default function MatchCard({ f, countdown = false }) {
  const theme = getCategoryTheme(f.category)
  return (
    <motion.div whileHover={{ y: -6 }} transition={SPRING} className="h-full">
      <Link
        to={`/${f.slug}`}
        style={themeVars(theme)}
        className="glass hover-pulse group flex h-full flex-col overflow-hidden rounded-2xl transition-colors duration-300"
      >
        <div className="aspect-video">
          <EventCover fixture={f} />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-neon-soft">
              {f.competition || theme.label}
            </span>
            {countdown && <Countdown target={f.date_time} />}
          </div>
          <p className="line-clamp-2 text-sm text-muted">{excerptFor(f)}</p>
          <div className="mt-auto pt-1 text-xs text-faint">
            {formatShort(f.date_time, f.language)}
            {f.broadcaster ? ` · ${f.broadcaster}` : ''}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
