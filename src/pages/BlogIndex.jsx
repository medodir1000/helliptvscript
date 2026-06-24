import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { usePosts } from '../hooks/usePosts.js'
import { getCategoryTheme, themeVars } from '../utils/categories.js'
import { formatShort } from '../utils/format.js'
import { site } from '../config/site.js'
import EventCover from '../components/EventCover.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import { Reveal, RevealStagger, RevealItem } from '../components/Reveal.jsx'

function FeaturedArticle({ p }) {
  const theme = getCategoryTheme(p.category)
  return (
    <Link
      to={`/blog/${p.slug}`}
      style={themeVars(theme)}
      className="hover-pulse group grid overflow-hidden rounded-2xl border border-ink-700 bg-ink-850/60 transition duration-300 hover:-translate-y-0.5 md:grid-cols-2"
    >
      <div className="aspect-video md:aspect-auto md:min-h-[18rem]">
        <EventCover
          fixture={{ event_title: p.title, category: p.category, image_url: p.cover_image }}
          featured
        />
      </div>
      <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-neon-soft">
          Featured
        </span>
        <p className="text-base leading-relaxed text-muted">{p.excerpt}</p>
        <div className="text-xs text-faint">
          {p.author} · {formatShort(p.published_at)}
        </div>
        <span className="mt-1 text-sm font-semibold text-neon-soft">Read article →</span>
      </div>
    </Link>
  )
}

function NewsCard({ p }) {
  const theme = getCategoryTheme(p.category)
  return (
    <Link
      to={`/blog/${p.slug}`}
      style={themeVars(theme)}
      className="hover-pulse group flex h-full flex-col overflow-hidden rounded-xl border border-ink-700 bg-ink-850/60 transition duration-300 hover:-translate-y-1 hover:bg-ink-800"
    >
      <div className="aspect-video">
        <EventCover fixture={{ event_title: p.title, category: p.category, image_url: p.cover_image }} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="line-clamp-2 text-sm text-muted">{p.excerpt}</p>
        <div className="mt-auto pt-1 text-xs text-faint">
          {p.author} · {formatShort(p.published_at)}
        </div>
      </div>
    </Link>
  )
}

export default function BlogIndex() {
  const { posts, loading } = usePosts()
  const [lead, ...rest] = posts

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Helmet>
        <title>{`News & Guides — Match Previews & Where to Watch | ${site.brand}`}</title>
        <meta
          name="description"
          content="Match previews, where-to-watch guides and honest streaming tips for the biggest live sports events."
        />
      </Helmet>

      <SiteHeader />

      <header className="mb-10 space-y-3">
        <span className="inline-flex items-center rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-neon-soft">
          News &amp; guides
        </span>
        <h1 className="font-display text-4xl font-black text-fg sm:text-5xl">The Blog</h1>
        <p className="max-w-2xl text-muted">
          Match previews, where-to-watch guides and honest streaming tips.
        </p>
      </header>

      {loading ? (
        <div className="space-y-8">
          <div className="h-72 animate-pulse rounded-2xl bg-ink-850" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-ink-850" />
            ))}
          </div>
        </div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-faint">No posts yet.</p>
      ) : (
        <div className="space-y-10">
          <Reveal>
            <FeaturedArticle p={lead} />
          </Reveal>
          {rest.length > 0 && (
            <RevealStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <RevealItem key={p.slug} className="h-full">
                  <NewsCard p={p} />
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
