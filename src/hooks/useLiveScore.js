import { useEffect, useRef, useState } from 'react'

// Live score from TheSportsDB lookupevent (real data). Polls only while a match
// is in play. Degrades silently to null (caller falls back to the countdown) on
// any error or when the fixture has no event_ref.
const TSDB_KEY = import.meta.env.VITE_THESPORTSDB_KEY || '3'
const BASE = `https://www.thesportsdb.com/api/v1/json/${TSDB_KEY}`
const POLL_MS = 30000

function classify(strStatus, hasScore, kickoffPast) {
  const s = String(strStatus || '').toUpperCase()
  if (/FT|FINISH|AET|PEN|ABAND|AWARD|CANC|POSTP/.test(s)) return 'finished'
  if (/1H|2H|HT|ET|LIVE|BREAK|^\d/.test(s)) return 'live'
  if (hasScore && kickoffPast) return 'live'
  return kickoffPast ? 'finished' : 'scheduled'
}

export function useLiveScore(eventRef, { kickoff } = {}) {
  const [data, setData] = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    if (!eventRef) {
      setData(null)
      return
    }
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch(`${BASE}/lookupevent.php?id=${encodeURIComponent(eventRef)}`)
        const json = await res.json()
        const ev = json?.events?.[0]
        if (cancelled || !ev) return

        const num = (v) => (v != null && v !== '' ? Number(v) : null)
        const homeScore = num(ev.intHomeScore)
        const awayScore = num(ev.intAwayScore)
        const kickoffPast = kickoff ? new Date(kickoff).getTime() <= Date.now() : false
        const statusKind = classify(ev.strStatus, homeScore != null, kickoffPast)

        setData({
          status: statusKind,
          home: ev.strHomeTeam || null,
          away: ev.strAwayTeam || null,
          homeScore,
          awayScore,
          minute: ev.strProgress ? String(ev.strProgress).replace(/[^\d+]/g, '') : null,
          rawStatus: ev.strStatus || null,
        })

        if (!cancelled && statusKind === 'live') {
          timer.current = setTimeout(poll, POLL_MS)
        }
      } catch {
        /* transient — keep the countdown fallback */
      }
    }

    poll()
    return () => {
      cancelled = true
      if (timer.current) clearTimeout(timer.current)
    }
  }, [eventRef, kickoff])

  return data
}
