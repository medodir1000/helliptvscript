import { Link } from 'react-router-dom'
import { formatShort } from '../utils/format.js'
import { getCategoryTheme, themeVars } from '../utils/categories.js'

/**
 * Internal-linking block: upcoming events in the same category. Real anchor
 * links (via React Router <Link>) so users and crawlers can discover related
 * pages.
 */
export default function RelatedFixtures({ fixtures, categoryLabel }) {
  if (!fixtures || fixtures.length === 0) return null

  return (
    <section className="border-t border-ink-800 pt-8">
      <h2 className="text-lg font-bold text-fg">
        More upcoming {categoryLabel ? categoryLabel.toLowerCase() : 'events'}
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {fixtures.map((f) => {
          const theme = getCategoryTheme(f.category)
          return (
            <Link
              key={f.slug}
              to={`/${f.slug}`}
              style={themeVars(theme)}
              className="group flex flex-col gap-1 rounded-xl border border-ink-700 bg-ink-850/60 p-4 transition hover:border-accent/50 hover:bg-ink-800"
            >
              <span className="text-xs font-medium uppercase tracking-widest text-accent-soft">
                {theme.label}
              </span>
              <span className="font-semibold text-fg group-hover:text-accent-soft">
                {f.event_title}
              </span>
              <span className="text-xs text-faint">
                {formatShort(f.date_time, f.language)}
                {f.broadcaster ? ` · ${f.broadcaster}` : ''}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
