import { useCountdown } from '../hooks/useCountdown.js'
import { useLiveScore } from '../hooks/useLiveScore.js'
import { watchLinksFor } from '../utils/broadcasters.js'
import { formatShort } from '../utils/format.js'

const pad = (n) => String(n).padStart(2, '0')

function teamsFromTitle(title) {
  const parts = String(title || '').split(/\s+vs\.?\s+/i)
  return { home: (parts[0] || title || '').trim(), away: (parts[1] || '').trim() }
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur">
      <span className="animate-live h-2.5 w-2.5 rounded-full bg-red-500" />
      <span className="text-xs font-bold uppercase tracking-widest text-fg">Live</span>
    </span>
  )
}

function Tag({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-black/30 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-neon-soft backdrop-blur">
      {children}
    </span>
  )
}

function NowOn({ links }) {
  if (!links.length) return null
  return (
    <div className="w-44 rounded-xl border border-neon/30 bg-ink-900/80 p-2 backdrop-blur">
      <div className="px-2 py-1 text-[0.625rem] font-bold uppercase tracking-widest text-faint">
        Now on
      </div>
      <ul className="space-y-0.5">
        {links.map((l, i) => (
          <li key={l.name}>
            {l.url ? (
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-white/5 ${
                  i === 0 ? 'bg-neon/15 font-semibold text-fg' : 'text-muted'
                }`}
              >
                <span className="text-neon-soft">▶</span>
                {l.name}
              </a>
            ) : (
              <span className="flex items-center gap-2 px-2 py-1.5 text-sm text-faint">
                <span>•</span>
                {l.name}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function WatchButton({ primary, live }) {
  if (!primary) {
    return (
      <span className="rounded-full border border-ink-600 bg-ink-900/70 px-5 py-3 text-sm text-muted">
        Check your local listings
      </span>
    )
  }
  return (
    <>
      <a
        href={primary.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Watch on ${primary.name} (official site)`}
        className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur transition hover:scale-105 hover:bg-white/20"
      >
        <svg viewBox="0 0 24 24" className="h-8 w-8 translate-x-0.5 fill-white">
          <path d="M8 5v14l11-7z" />
        </svg>
      </a>
      <a
        href={primary.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-fg underline-offset-4 hover:underline"
      >
        {live ? 'Watch live on' : 'Watch on'} {primary.name} ↗
      </a>
    </>
  )
}

export default function MatchHero({ fixture, theme }) {
  const live = useLiveScore(fixture.event_ref, { kickoff: fixture.date_time })
  const countdown = useCountdown(fixture.date_time)

  const fallback = teamsFromTitle(fixture.event_title)
  const home = live?.home || fallback.home
  const away = live?.away || fallback.away
  const status =
    live?.status ||
    (countdown.isLive ? 'live' : countdown.isFinished ? 'finished' : 'scheduled')
  const hasScore = live?.homeScore != null && live?.awayScore != null

  const links = watchLinksFor(fixture.broadcaster)
  const primary = links.find((l) => l.url) || null

  const minutePct =
    status === 'live' && live?.minute
      ? Math.min(100, (Number(live.minute) / 90) * 100)
      : status === 'finished'
        ? 100
        : 0

  return (
    <section className="relative overflow-hidden rounded-3xl border border-ink-700">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/25 via-ink-900 to-neon/10" />
      <div className="relative p-5 sm:p-7">
        {/* top row */}
        <div className="flex items-start justify-between gap-3">
          {status === 'live' ? <LiveBadge /> : <Tag>{theme.label}</Tag>}
          <NowOn links={links} />
        </div>

        {/* watch CTA (links to the official broadcaster — not an in-page stream) */}
        <div className="flex flex-col items-center gap-3 py-10">
          <WatchButton primary={primary} live={status === 'live'} />
        </div>

        {/* score / matchup */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-widest text-neon-soft">
              {theme.label}
            </div>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-fg sm:text-3xl">
              <span>{home}</span>
              {hasScore ? (
                <span className="px-2 tabular-nums">
                  {live.homeScore} — {live.awayScore}
                </span>
              ) : (
                <span className="px-2 text-muted">vs</span>
              )}
              <span>{away}</span>
            </h1>
          </div>
          <div className="shrink-0 text-right">
            {status === 'live' && live?.minute ? (
              <span className="rounded-lg bg-ink-900/80 px-2 py-1 font-mono text-sm font-bold text-fg">
                {live.minute}&apos;
              </span>
            ) : status === 'finished' ? (
              <span className="rounded-lg bg-ink-900/80 px-2 py-1 text-sm font-bold text-muted">
                FT
              </span>
            ) : countdown.valid && !countdown.isFinished ? (
              <span className="font-mono text-sm text-muted">
                {pad(countdown.parts.days * 24 + countdown.parts.hours)}:
                {pad(countdown.parts.minutes)}:{pad(countdown.parts.seconds)}
              </span>
            ) : (
              <span className="text-sm text-muted">
                {formatShort(fixture.date_time, fixture.language)}
              </span>
            )}
          </div>
        </div>

        {/* match progress */}
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-neon transition-all duration-500"
              style={{ width: `${minutePct}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
