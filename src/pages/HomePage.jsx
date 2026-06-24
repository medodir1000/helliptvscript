import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase, isSupabaseConfigured, FIXTURE_COLUMNS } from '../lib/supabase.js'
import { usePosts } from '../hooks/usePosts.js'
import { site } from '../config/site.js'
import { SECTIONS, postInSection } from '../config/sections.js'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import FixturesMarquee from '../components/FixturesMarquee.jsx'
import { FeaturedPost, PostCard, PostRow, SectionHead, Kicker } from '../components/PostCard.jsx'
import { Reveal, RevealStagger, RevealItem } from '../components/Reveal.jsx'

export default function HomePage() {
  const [fixtures, setFixtures] = useState([])
  const { posts, loading } = usePosts(48)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    supabase
      .from('fixtures')
      .select(FIXTURE_COLUMNS)
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true })
      .limit(20)
      .then(({ data }) => {
        if (!cancelled) setFixtures(data || [])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const [lead, ...rest] = posts
  const trending = rest.slice(0, 5)
  const moreStories = rest.slice(0, 6)

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Helmet>
        <title>{`${site.brand} — Streaming, Sports & Entertainment Magazine`}</title>
        <meta
          name="description"
          content="Match previews, movie & series streaming guides, and honest where-to-watch tips for football, combat sports, tennis and rugby."
        />
      </Helmet>

      <SiteHeader />

      {/* Compressed World Cup fixtures strip (temporary event) */}
      {fixtures.length > 0 && (
        <Reveal>
          <div className="mb-10">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-live rounded-full bg-red-500" />
              <Kicker>World Cup 2026 · Live &amp; upcoming</Kicker>
              <Link
                to="/football"
                className="ml-auto text-xs font-semibold text-accent hover:underline"
              >
                Full schedule →
              </Link>
            </div>
            <FixturesMarquee fixtures={fixtures} />
          </div>
        </Reveal>
      )}

      {/* Editorial lead + trending sidebar */}
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-surface-2 lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-surface-2" />
        </div>
      ) : lead ? (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Reveal>
              <FeaturedPost p={lead} />
            </Reveal>
          </div>
          <div>
            <Reveal>
              <aside className="glass rounded-2xl p-5">
                <Kicker>Trending</Kicker>
                <div className="mt-3">
                  {trending.length > 0 ? (
                    trending.map((p, i) => <PostRow key={p.slug} p={p} index={i} />)
                  ) : (
                    <p className="text-sm text-faint">More stories coming soon.</p>
                  )}
                </div>
              </aside>
            </Reveal>
          </div>
        </section>
      ) : (
        <section className="glass rounded-2xl p-10 text-center">
          <h2 className="font-display text-xl font-bold text-fg">The magazine is just getting started</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            New previews and streaming guides are on the way. Meanwhile, browse the live schedule.
          </p>
          <Link
            to="/football"
            className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            View the schedule
          </Link>
        </section>
      )}

      {/* Latest stories */}
      {moreStories.length > 0 && (
        <section className="mt-14">
          <SectionHead title="Latest stories" href="/blog" />
          <RevealStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {moreStories.map((p) => (
              <RevealItem key={p.slug} className="h-full">
                <PostCard p={p} />
              </RevealItem>
            ))}
          </RevealStagger>
        </section>
      )}

      {/* Category rows — only render sections that actually have stories */}
      {SECTIONS.map((s) => {
        const inCat = posts.filter((p) => postInSection(p, s))
        if (inCat.length === 0) return null
        return (
          <section key={s.slug} className="mt-14">
            <SectionHead title={s.label} href={`/${s.slug}`} />
            <RevealStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {inCat.slice(0, 3).map((p) => (
                <RevealItem key={p.slug} className="h-full">
                  <PostCard p={p} />
                </RevealItem>
              ))}
            </RevealStagger>
          </section>
        )
      })}

      <SiteFooter />
    </div>
  )
}
