import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { site } from '../config/site.js'
import CtaButton from './CtaButton.jsx'
import EventCover from './EventCover.jsx'
import CountdownTimer from './CountdownTimer.jsx'

const EASE = [0.22, 1, 0.36, 1]

export default function Hero({ featured }) {
  const h = site.hero
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 -top-24 h-96 w-96 rounded-full bg-accent/25 blur-[100px]" />
        <div className="absolute -right-10 top-8 h-80 w-80 rounded-full bg-neon/15 blur-[100px]" />
      </div>

      <div className="grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-2 lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-neon-soft">
            <span className="h-1.5 w-1.5 animate-live rounded-full bg-neon" />
            {h.eyebrow}
          </span>

          <h1 className="mt-5 text-balance font-display text-[2.6rem] font-black leading-[1.02] tracking-tight text-fg sm:text-6xl">
            {h.title} <span className="text-neon">{h.titleAccent}</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{h.subtitle}</p>

          <div className="mt-8 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <CtaButton eventTitle="the 2026 World Cup">{h.ctaLabel}</CtaButton>
              <a
                href="#matches"
                className="inline-flex items-center rounded-xl border border-ink-700 px-5 py-3 text-sm font-semibold text-muted transition hover:border-neon/40 hover:text-fg"
              >
                Browse matches
              </a>
            </div>
            <p className="text-xs text-faint">{h.ctaSub}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.85, ease: EASE, delay: 0.1 }}
        >
          {featured ? (
            <Link
              to={`/${featured.slug}`}
              className="hover-pulse group relative block overflow-hidden rounded-3xl border border-ink-700"
            >
              <div className="aspect-video">
                <EventCover fixture={featured} featured overlay={false} />
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 sm:p-5">
                <div className="min-w-0">
                  <div className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-neon-soft">
                    Featured · open guide
                  </div>
                  <div className="truncate font-display text-lg font-bold text-fg">
                    {featured.event_title}
                  </div>
                </div>
                <CountdownTimer target={featured.date_time} />
              </div>
            </Link>
          ) : (
            <div className="aspect-video animate-pulse rounded-3xl bg-ink-850" />
          )}
        </motion.div>
      </div>
    </section>
  )
}
