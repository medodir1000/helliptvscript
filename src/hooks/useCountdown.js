import { useEffect, useState } from 'react'

/** Default window during which an event is considered "live" after start. */
const DEFAULT_LIVE_WINDOW_MS = 3 * 60 * 60 * 1000 // 3 hours

function computeState(target, liveWindowMs) {
  const now = Date.now()
  const start = new Date(target).getTime()

  if (Number.isNaN(start)) {
    return { valid: false, isLive: false, isFinished: false, parts: zero() }
  }

  const diff = start - now

  if (diff > 0) {
    return { valid: true, isLive: false, isFinished: false, parts: breakdown(diff) }
  }

  const sinceStart = now - start
  if (sinceStart <= liveWindowMs) {
    return { valid: true, isLive: true, isFinished: false, parts: zero() }
  }

  return { valid: true, isLive: false, isFinished: true, parts: zero() }
}

function breakdown(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

const zero = () => ({ days: 0, hours: 0, minutes: 0, seconds: 0 })

/**
 * Countdown to `target` (ISO string or Date).
 * Returns { parts: {days,hours,minutes,seconds}, isLive, isFinished, valid }.
 * Switches to `isLive` for `liveWindowMs` after start, then `isFinished`.
 */
export function useCountdown(target, liveWindowMs = DEFAULT_LIVE_WINDOW_MS) {
  const [state, setState] = useState(() => computeState(target, liveWindowMs))

  useEffect(() => {
    setState(computeState(target, liveWindowMs))
    const id = setInterval(() => {
      setState(computeState(target, liveWindowMs))
    }, 1000)
    return () => clearInterval(id)
  }, [target, liveWindowMs])

  return state
}
