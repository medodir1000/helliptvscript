/**
 * Centralised, environment-driven site configuration.
 *
 * Everything user-facing and operator-tunable lives here so the components
 * stay free of hard-coded brand strings, phone numbers, or URLs.
 */

const env = import.meta.env

export const site = {
  brand: env.VITE_BRAND_NAME || 'HellIPTV',
  origin: (env.VITE_SITE_ORIGIN || 'https://blog.helliptv.com').replace(/\/$/, ''),

  cta: {
    // Base of the outbound contact link (e.g. a wa.me number or support URL).
    base: env.VITE_CTA_BASE || '',
    // {event} is replaced with the event title at click time.
    messageTemplate:
      env.VITE_CTA_MESSAGE_TEMPLATE || "Hi, I'd like help watching {event}.",
  },

  networkTest: {
    // URL to time the round-trip against. Empty → same-origin root.
    url: env.VITE_LATENCY_TEST_URL || '',
    samples: 6,
  },

  // Hero copy (honest, benefit-driven).
  hero: {
    eyebrow: 'FIFA World Cup 2026 · Live',
    title: 'Where to watch the World Cup.',
    titleAccent: 'Instantly.',
    subtitle:
      'Kickoff times, the official broadcaster for your region, live scores and match previews — every 2026 World Cup match in one place.',
    ctaLabel: 'Chat with us on WhatsApp',
    ctaSub: 'Questions about watching a match? Message us.',
  },

  // Honest, benefit-driven value props.
  valueProps: [
    { title: 'A real speed test', body: 'Actual download / upload / ping via LibreSpeed — not a browser estimate.' },
    { title: 'Official broadcasters', body: 'Every match links to the licensed broadcaster for your region.' },
    { title: 'Live scores & countdowns', body: 'Real-time scores and kickoff timers on every match page.' },
    { title: 'Always up to date', body: 'Fixtures sync automatically, so the schedule is never stale.' },
  ],

  // Social proof — PLACEHOLDERS. Replace with your REAL figures before launch;
  // displaying numbers or ratings you can't substantiate is false advertising.
  social: {
    rating: '4.8',
    ratingOutOf: '5',
    reviews: '2,400+',
    members: '60,000+',
    testimonials: [
      { quote: 'Found the official stream for every group game in seconds.', name: 'Placeholder — replace', meta: 'World Cup fan' },
      { quote: 'The speed test told me to switch to ethernet before the final. Zero buffering.', name: 'Placeholder — replace', meta: 'Member' },
      { quote: 'Finally, one place with the right broadcaster for my country.', name: 'Placeholder — replace', meta: 'Subscriber' },
    ],
  },
}
