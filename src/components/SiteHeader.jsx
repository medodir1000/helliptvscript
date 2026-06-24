import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from './Logo.jsx'
import { site } from '../config/site.js'
import { SECTIONS } from '../config/sections.js'

const NAV = [
  { to: '/', label: 'Home', end: true },
  ...SECTIONS.map((s) => ({ to: `/${s.slug}`, label: s.label })),
  { to: '/help-center', label: 'Help' },
]

export default function SiteHeader() {
  const { pathname } = useLocation()
  const isActive = (n) =>
    n.end ? pathname === n.to : pathname === n.to || pathname.startsWith(`${n.to}/`)

  return (
    <header className="sticky top-0 z-40 -mx-4 mb-8 border-b border-line bg-canvas/80 backdrop-blur-md sm:-mx-6">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <Link to="/" aria-label={site.brand} className="shrink-0">
          <Logo />
        </Link>

        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((n) => {
            const active = isActive(n)
            return (
              <Link
                key={n.to}
                to={n.to}
                aria-current={active ? 'page' : undefined}
                className="relative shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium"
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-full bg-accent/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span
                  className={`relative transition-colors duration-200 ${
                    active ? 'text-accent' : 'text-muted hover:text-fg'
                  }`}
                >
                  {n.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
