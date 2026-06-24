import { site } from '../config/site.js'
import { Reveal } from './Reveal.jsx'

// Renders site.social. Those values are PLACEHOLDERS in config/site.js — set
// real figures before launch.
export default function SocialProof() {
  const s = site.social
  return (
    <Reveal>
      <section className="rounded-3xl border border-ink-700 bg-ink-850/40 p-6 sm:p-8">
        <div className="grid items-center gap-6 lg:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:border-r lg:border-ink-700 lg:pr-8">
            <span className="font-display text-5xl font-black leading-none text-fg">{s.rating}</span>
            <div>
              <div className="text-lg leading-none tracking-widest text-neon">★★★★★</div>
              <div className="mt-1 text-xs text-muted">
                {s.reviews} reviews · {s.members} members
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {s.testimonials.map((t, i) => (
              <figure key={i} className="rounded-xl border border-ink-700 bg-ink-900/50 p-4">
                <blockquote className="text-sm leading-relaxed text-muted">“{t.quote}”</blockquote>
                <figcaption className="mt-2 text-xs font-semibold text-faint">
                  — {t.name}
                  {t.meta ? `, ${t.meta}` : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  )
}
