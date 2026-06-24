import CountdownTimer from './CountdownTimer.jsx'
import { formatDateTime } from '../utils/format.js'

export default function EventHeader({ fixture, theme }) {
  return (
    <header className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-soft">
          {theme.label}
        </span>
        {fixture.language && (
          <span className="inline-flex items-center rounded-full border border-ink-700 bg-ink-850 px-3 py-1 text-xs font-medium uppercase tracking-widest text-muted">
            {fixture.language}
          </span>
        )}
      </div>

      <h1 className="text-balance text-3xl font-extrabold leading-tight text-fg sm:text-4xl md:text-5xl">
        {fixture.event_title}
      </h1>

      <p className="text-sm text-muted sm:text-base">
        {formatDateTime(fixture.date_time, fixture.language)}
      </p>

      <div className="pt-1">
        <CountdownTimer target={fixture.date_time} />
      </div>
    </header>
  )
}
