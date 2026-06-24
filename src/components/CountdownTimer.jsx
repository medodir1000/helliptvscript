import { useCountdown } from '../hooks/useCountdown.js'

const pad = (n) => String(n).padStart(2, '0')

function Cell({ value, label }) {
  return (
    <div className="flex min-w-[3.75rem] flex-col items-center rounded-xl border border-ink-700 bg-ink-850/80 px-3 py-2">
      <span className="font-mono text-2xl font-bold tabular-nums text-fg sm:text-3xl">
        {pad(value)}
      </span>
      <span className="mt-0.5 text-[0.625rem] uppercase tracking-widest text-faint">
        {label}
      </span>
    </div>
  )
}

export default function CountdownTimer({ target }) {
  const { parts, isLive, isFinished, valid } = useCountdown(target)

  if (!valid) return null

  if (isLive) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2">
        <span className="animate-live inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
        <span className="text-sm font-bold uppercase tracking-widest text-red-400">
          Live now
        </span>
      </div>
    )
  }

  if (isFinished) {
    return (
      <span className="inline-flex items-center rounded-full border border-ink-700 bg-ink-850 px-4 py-2 text-sm font-medium text-muted">
        Event ended
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3" role="timer" aria-live="off">
      {parts.days > 0 && <Cell value={parts.days} label="Days" />}
      <Cell value={parts.hours} label="Hrs" />
      <Cell value={parts.minutes} label="Min" />
      <Cell value={parts.seconds} label="Sec" />
    </div>
  )
}
