import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import { Reveal } from '../components/Reveal.jsx'
import { site } from '../config/site.js'

const SPRING = { type: 'spring', stiffness: 300, damping: 22 }

const FAQS = [
  {
    q: 'How do I find where to watch a match?',
    a: 'Open any match from the schedule. Each page lists the official broadcaster for your region, the kickoff time in your local time, and where to watch on the licensed platform.',
  },
  {
    q: 'Which devices can I watch on?',
    a: 'Any device that runs the official broadcaster’s app — Smart TVs (Samsung, LG), Amazon Fire TV / Firestick, Roku, Apple TV, Android TV, plus phones, tablets and web browsers. Install the broadcaster’s official app from your device’s app store and sign in.',
  },
  {
    q: 'Do I need a subscription?',
    a: 'It depends on the match and your country. Some games are free-to-air; others need a TV package or a streaming subscription. The match page always names the official broadcaster, so you know exactly where to go.',
  },
  {
    q: 'The stream keeps buffering — what can I do?',
    a: 'Buffering is almost always a local network issue. Use a wired Ethernet connection where possible, move closer to your router, close other streaming or download apps, lower the video quality, and restart your router. None of these require special software.',
  },
  {
    q: 'Is the schedule kept up to date?',
    a: 'Yes. Fixtures sync automatically from the sports-data provider, so kickoff times and broadcasters stay current without manual updates.',
  },
  {
    q: 'Is this site free to use?',
    a: 'Yes. The guide is free — it helps you find the official, licensed place to watch each match in your region.',
  },
]

const DEVICES = [
  { name: 'Fire TV / Firestick', note: 'Install the official broadcaster app from the Amazon Appstore and sign in.' },
  { name: 'Smart TV (Samsung, LG)', note: 'Add your broadcaster’s app from the built-in TV app store.' },
  { name: 'Apple TV / Roku', note: 'Add the broadcaster channel from the App Store / Channel Store.' },
  { name: 'Phone, tablet & web', note: 'Use the broadcaster’s official app or website and sign in with your subscription.' },
]

function Faq({ q, a }) {
  return (
    <details className="glass group rounded-2xl px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-semibold text-fg">
        {q}
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 text-neon-soft transition-transform duration-300 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
    </details>
  )
}

export default function HelpCenterPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Helmet>
        <title>{`Help Center — How to Watch | ${site.brand}`}</title>
        <meta
          name="description"
          content="Setup help and FAQs: which devices you can watch on, how to find the official broadcaster for each match, and tips for a smooth, reliable stream."
        />
      </Helmet>

      <SiteHeader />

      <Reveal>
        <header className="py-8 text-center sm:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-soft">Help Center</p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-fg sm:text-5xl">
            Watch every match, on any screen.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Everything you need to find the official broadcaster for your region and get a smooth,
            reliable stream.
          </p>
        </header>
      </Reveal>

      <Reveal>
        <section className="mb-12">
          <h2 className="mb-4 font-display text-xl font-bold text-fg">Device compatibility</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {DEVICES.map((d) => (
              <motion.div
                key={d.name}
                whileHover={{ y: -4 }}
                transition={SPRING}
                className="glass hover-pulse rounded-2xl p-5"
              >
                <h3 className="font-display font-bold text-fg">{d.name}</h3>
                <p className="mt-1 text-sm text-muted">{d.note}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mb-12">
          <h2 className="mb-4 font-display text-xl font-bold text-fg">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <Faq key={f.q} {...f} />
            ))}
          </div>
        </section>
      </Reveal>

      <SiteFooter />
    </div>
  )
}
