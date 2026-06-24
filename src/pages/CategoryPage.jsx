import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase, isSupabaseConfigured, FIXTURE_COLUMNS } from '../lib/supabase.js'
import { usePosts } from '../hooks/usePosts.js'
import { site } from '../config/site.js'
import { postInSection } from '../config/sections.js'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import FixturesMarquee from '../components/FixturesMarquee.jsx'
import { FeaturedPost, PostCard, Kicker } from '../components/PostCard.jsx'
import { Reveal, RevealStagger, RevealItem } from '../components/Reveal.jsx'

export default function CategoryPage({ section }) {
  const { posts, loading } = usePosts(48)
  const [fixtures, setFixtures] = useState([])
  const inCat = posts.filter((p) => postInSection(p, section))

  useEffect(() => {
    if (!section.sport || !isSupabaseConfigured) {
      setFixtures([])
      return
    }
    let cancelled = false
    supabase
      .from('fixtures')
      .select(FIXTURE_COLUMNS)
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true })
      .limit(24)
      .then(({ data }) => {
        if (cancelled) return
        const fx = (data || []).filter((f) =>
          section.cats.includes(String(f.category || '').toLowerCase()),
        )
        setFixtures(fx)
      })
    return () => {
      cancelled = true
    }
  }, [section])

  const [lead, ...rest] = inCat

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Helmet>
        <title>{`${section.label} — News & Where to Watch | ${site.brand}`}</title>
        <meta
          name="description"
          content={`${section.label}: previews, streaming guides and where to watch, on ${site.brand}.`}
        />
      </Helmet>

      <SiteHeader />

      <header className="py-4 sm:py-6">
        <Kicker>{section.label}</Kicker>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-fg sm:text-5xl">
          {section.label}
        </h1>
      </header>

      {section.sport && fixtures.length > 0 && (
        <div className="mb-10">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-live rounded-full bg-red-500" />
            <Kicker>Live &amp; upcoming</Kicker>
            <Link to="/football" className="ml-auto text-xs font-semibold text-accent hover:underline">
              All matches →
            </Link>
          </div>
          <FixturesMarquee fixtures={fixtures} />
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : inCat.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <h2 className="font-display text-xl font-bold text-fg">No {section.label} stories yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            We&apos;re publishing here soon.{' '}
            {section.sport
              ? 'Meanwhile, the live schedule above is up to date.'
              : 'Meanwhile, browse the latest from the blog.'}
          </p>
          <Link
            to={section.sport ? '/football' : '/blog'}
            className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {section.sport ? 'View the schedule' : 'Read the blog'}
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          <Reveal>
            <FeaturedPost p={lead} />
          </Reveal>
          {rest.length > 0 && (
            <RevealStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <RevealItem key={p.slug} className="h-full">
                  <PostCard p={p} />
                </RevealItem>
              ))}
            </RevealStagger>
          )}
        </div>
      )}

      <SiteFooter />
    </div>
  )
}
