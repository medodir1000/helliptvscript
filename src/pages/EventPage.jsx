import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useFixture } from '../hooks/useFixture.js'
import { useRelatedFixtures } from '../hooks/useRelatedFixtures.js'
import { getCategoryTheme, themeVars } from '../utils/categories.js'
import { buildMeta, buildJsonLd, canonicalUrl } from '../utils/seo.js'
import Seo from '../components/Seo.jsx'
import MatchHero from '../components/MatchHero.jsx'
import RelatedFixtures from '../components/RelatedFixtures.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import NotFound from './NotFound.jsx'

function Shell({ children, style }) {
  return (
    <div style={style} className="mx-auto min-h-dvh max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      {children}
    </div>
  )
}

function Noindex() {
  return (
    <Helmet>
      <meta name="robots" content="noindex" />
    </Helmet>
  )
}

export default function EventPage() {
  const { slug } = useParams()
  const { fixture, status } = useFixture(slug)

  const category = fixture?.category
  const related = useRelatedFixtures(category, slug)
  const theme = getCategoryTheme(category)

  if (status === 'loading') {
    return (
      <Shell>
        <Noindex />
        <div className="animate-pulse space-y-6">
          <div className="h-56 w-full rounded-3xl bg-ink-850" />
          <div className="h-24 w-full rounded-xl bg-ink-850" />
        </div>
      </Shell>
    )
  }

  if (status === 'unconfigured') {
    return (
      <Shell>
        <Noindex />
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-200">
          <p className="font-semibold">Supabase is not configured.</p>
          <p className="mt-1 text-amber-200/80">
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your{' '}
            <code>.env</code>, then restart the dev server.
          </p>
        </div>
      </Shell>
    )
  }

  if (status === 'error') {
    return (
      <Shell>
        <Noindex />
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
          Something went wrong loading this event. Please try again shortly.
        </div>
      </Shell>
    )
  }

  if (status === 'not-found' || !fixture) {
    return <NotFound />
  }

  const meta = buildMeta(fixture)
  const jsonLd = buildJsonLd(fixture)

  return (
    <Shell style={themeVars(theme)}>
      <Seo
        title={meta.title}
        description={meta.description}
        canonical={canonicalUrl(fixture.slug)}
        lang={fixture.language || 'en'}
        jsonLd={jsonLd}
      />

      <SiteHeader />

      <MatchHero fixture={fixture} theme={theme} />

      {fixture.content_cache && (
        <div className="mt-8 max-w-none text-pretty leading-relaxed text-muted">
          {fixture.content_cache.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="mb-4">
              {para}
            </p>
          ))}
        </div>
      )}

      <div className="mt-12">
        <RelatedFixtures fixtures={related} categoryLabel={theme.label} />
      </div>

      <SiteFooter />
    </Shell>
  )
}
