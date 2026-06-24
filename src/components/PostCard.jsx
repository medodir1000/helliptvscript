import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import EventCover from './EventCover.jsx'
import { getCategoryTheme, themeVars } from '../utils/categories.js'
import { formatShort } from '../utils/format.js'

const SPRING = { type: 'spring', stiffness: 300, damping: 24 }

export function Kicker({ children }) {
  return (
    <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{children}</span>
  )
}

export function SectionHead({ title, sub, href }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-3">
      <div>
        <h2 className="font-display text-2xl font-black tracking-tight text-fg">{title}</h2>
        {sub && <p className="mt-1 text-sm text-faint">{sub}</p>}
      </div>
      {href && (
        <Link to={href} className="shrink-0 text-sm font-semibold text-accent hover:underline">
          View all →
        </Link>
      )}
    </div>
  )
}

/** Large editorial lead card (image left, copy right on md+). */
export function FeaturedPost({ p }) {
  const theme = getCategoryTheme(p.category)
  return (
    <Link
      to={`/blog/${p.slug}`}
      style={themeVars(theme)}
      className="glass hover-pulse group grid h-full overflow-hidden rounded-2xl transition md:grid-cols-2"
    >
      <div className="aspect-video md:aspect-auto md:min-h-[20rem]">
        <EventCover
          fixture={{ event_title: p.title, category: p.category, image_url: p.cover_image }}
          featured
        />
      </div>
      <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
        <p className="text-base leading-relaxed text-muted">{p.excerpt}</p>
        <div className="text-xs text-faint">
          {p.author} · {formatShort(p.published_at)}
        </div>
        <span className="mt-1 text-sm font-semibold text-accent">Read article →</span>
      </div>
    </Link>
  )
}

/** Standard magazine grid card. */
export function PostCard({ p }) {
  const theme = getCategoryTheme(p.category)
  return (
    <motion.div whileHover={{ y: -5 }} transition={SPRING} className="h-full">
      <Link
        to={`/blog/${p.slug}`}
        style={themeVars(theme)}
        className="glass hover-pulse group flex h-full flex-col overflow-hidden rounded-2xl transition-colors"
      >
        <div className="aspect-video">
          <EventCover
            fixture={{ event_title: p.title, category: p.category, image_url: p.cover_image }}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="line-clamp-2 text-sm text-muted">{p.excerpt}</p>
          <div className="mt-auto pt-1 text-xs text-faint">
            {p.author} · {formatShort(p.published_at)}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

/** Compact numbered list row for the "Trending" sidebar. */
export function PostRow({ p, index }) {
  return (
    <Link
      to={`/blog/${p.slug}`}
      className="group flex items-start gap-3 border-b border-line py-3 last:border-0"
    >
      {index != null && (
        <span className="font-display text-lg font-black leading-none text-accent/40">
          {String(index + 1).padStart(2, '0')}
        </span>
      )}
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-fg group-hover:text-accent">
          {p.title}
        </h3>
        <div className="mt-0.5 text-xs text-faint">{formatShort(p.published_at)}</div>
      </div>
    </Link>
  )
}
