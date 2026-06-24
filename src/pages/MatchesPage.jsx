import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase, isSupabaseConfigured, FIXTURE_COLUMNS } from '../lib/supabase.js'
import { site } from '../config/site.js'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import MatchCard from '../components/MatchCard.jsx'
import { Reveal, RevealStagger, RevealItem } from '../components/Reveal.jsx'

const ALL = 'All'

export default function MatchesPage() {
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(ALL)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let cancelled = false
    supabase
      .from('fixtures')
      .select(FIXTURE_COLUMNS)
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true })
      .limit(120)
      .then(({ data }) => {
        if (cancelled) return
        setFixtures(data || [])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const competitions = useMemo(() => {
    const set = new Set()
    fixtures.forEach((f) => {
      if (f.competition) set.add(f.competition)
    })
    return [ALL, ...[...set].sort()]
  }, [fixtures])

  const filtered = useMemo(
    () => (active === ALL ? fixtures : fixtures.filter((f) => f.competition === active)),
    [fixtures, active],
  )

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Helmet>
        <title>{`Match Schedule — Where to Watch | ${site.brand}`}</title>
        <meta
          name="description"
          content="The full upcoming fixture schedule with live countdowns and the official broadcaster for every match. Filter by competition."
        />
      </Helmet>

      <SiteHeader />

      <Reveal>
        <header className="py-6 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-soft">Schedule</p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-fg sm:text-5xl">
            Upcoming matches
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            Live countdowns and the official broadcaster for every fixture. Filter by competition
            below.
          </p>
        </header>
      </Reveal>

      {competitions.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {competitions.map((c) => {
            const on = c === active
            return (
              <button
                key={c}
                onClick={() => setActive(c)}
                aria-pressed={on}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  on
                    ? 'border-neon/60 bg-neon/15 text-neon-soft'
                    : 'border-ink-700 text-muted hover:border-ink-600 hover:text-fg'
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-ink-850/60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-faint">No upcoming matches found.</p>
      ) : (
        <RevealStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <RevealItem key={f.slug} className="h-full">
              <MatchCard f={f} countdown />
            </RevealItem>
          ))}
        </RevealStagger>
      )}

      <SiteFooter />
    </div>
  )
}
