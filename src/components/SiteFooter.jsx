import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import CtaButton from './CtaButton.jsx'
import { site } from '../config/site.js'
import { SECTIONS } from '../config/sections.js'

const EXPLORE = [
  { to: '/', label: 'Home' },
  { to: '/matches', label: 'Live Matches' },
  { to: '/blog', label: 'News & Guides' },
  { to: '/help-center', label: 'Help Center' },
]

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-line">
      <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand + CTA */}
        <div>
          <Link to="/" aria-label={site.brand} className="inline-block">
            <Logo />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Your honest where-to-watch guide — kickoff times, official broadcasters and
            live-streaming guides for the biggest matches, movies and shows.
          </p>
          <div className="mt-5">
            <CtaButton eventTitle="live sport and streaming">Chat with us on WhatsApp</CtaButton>
          </div>
        </div>

        {/* Explore */}
        <nav aria-label="Explore">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-faint">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {EXPLORE.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-muted transition-colors hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Categories */}
        <nav aria-label="Categories">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-faint">Categories</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.slug}>
                <Link to={`/${s.slug}`} className="text-muted transition-colors hover:text-accent">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Watch legally */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-faint">Watch legally</h3>
          <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-muted">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-neon" />
            We only point to official, licensed broadcasters. Streaming rights vary by country —
            always check the broadcaster licensed for your region.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col gap-3 border-t border-line py-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {site.brand}. All rights reserved.
        </p>
        <p>Listings are informational and may change. Not affiliated with any broadcaster.</p>
      </div>
    </footer>
  )
}
