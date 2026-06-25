import { useParams } from 'react-router-dom'
import { usePost } from '../hooks/usePosts.js'
import { getCategoryTheme, themeVars } from '../utils/categories.js'
import { formatShort } from '../utils/format.js'
import { site } from '../config/site.js'
import Seo from '../components/Seo.jsx'
import EventCover from '../components/EventCover.jsx'
import Markdown from '../components/Markdown.jsx'
import CtaButton from '../components/CtaButton.jsx'
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

export default function BlogPost() {
  const { slug } = useParams()
  const { post, status } = usePost(slug)
  const theme = getCategoryTheme(post?.category)

  if (status === 'loading') {
    return (
      <Shell>
        <SiteHeader />
        <div className="h-72 animate-pulse rounded-2xl bg-ink-850" />
      </Shell>
    )
  }
  if (status === 'unconfigured') {
    return (
      <Shell>
        <SiteHeader />
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-200">
          Supabase is not configured.
        </div>
      </Shell>
    )
  }
  if (status === 'error') {
    return (
      <Shell>
        <SiteHeader />
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
          Could not load this post. Please try again shortly.
        </div>
      </Shell>
    )
  }
  if (status === 'not-found' || !post) {
    return <NotFound />
  }

  const canonical = site.origin ? `${site.origin}/blog/${post.slug}` : undefined
  const description = post.meta_description || post.excerpt || post.title
  const faqItems = Array.isArray(post.faq) ? post.faq.filter((f) => f && f.q && f.a) : []
  const articleLd = {
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    ...(post.published_at && { datePublished: new Date(post.published_at).toISOString() }),
    author: { '@type': 'Organization', name: post.author || site.brand },
    ...(Array.isArray(post.tags) && post.tags.length ? { keywords: post.tags.join(', ') } : {}),
    ...(canonical && { mainEntityOfPage: canonical, url: canonical }),
  }
  const faqLd =
    faqItems.length > 0
      ? {
          '@type': 'FAQPage',
          mainEntity: faqItems.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [articleLd, ...(faqLd ? [faqLd] : [])],
  }

  return (
    <Shell style={themeVars(theme)}>
      <Seo
        title={`${post.title} | ${site.brand}`}
        description={description}
        canonical={canonical}
        lang="en"
        jsonLd={jsonLd}
      />
      <SiteHeader />

      <article>
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-ink-700">
          <EventCover
            fixture={{ event_title: post.title, category: post.category, image_url: post.cover_image }}
            featured
            overlay={false}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-5 sm:p-7">
            <span
              className="rounded px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow"
              style={{ background: theme.accent }}
            >
              {theme.label}
            </span>
            <h1 className="line-clamp-4 font-display text-2xl font-black uppercase leading-[1.05] tracking-tighter text-white drop-shadow-xl md:text-4xl">
              {post.title}
            </h1>
          </div>
        </div>
        <div className="mt-3 text-sm text-faint">
          {post.author} · {formatShort(post.published_at)}
        </div>

        <div className="mt-8">
          <Markdown>{post.body}</Markdown>
        </div>

        {faqItems.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-black text-fg">FAQ</h2>
            <div className="mt-4 space-y-3">
              {faqItems.map((f, i) => (
                <details
                  key={i}
                  className="glass group rounded-2xl px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-semibold text-fg">
                    {f.q}
                    <span className="text-accent transition-transform duration-300 group-open:rotate-180">
                      ▾
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="glass mt-10 rounded-2xl p-6 text-center">
          <h2 className="font-display text-xl font-bold text-fg">Ready to watch?</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Get help setting up live sports &amp; streaming on your device.
          </p>
          <div className="mt-4 flex justify-center">
            <CtaButton eventTitle={post.title}>Chat with us on WhatsApp</CtaButton>
          </div>
        </div>
      </article>

      <SiteFooter />
    </Shell>
  )
}
