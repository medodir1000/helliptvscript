import { site } from '../config/site.js'
import { RevealStagger, RevealItem } from './Reveal.jsx'

export default function ValueProps() {
  return (
    <RevealStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {site.valueProps.map((v) => (
        <RevealItem key={v.title}>
          <div className="hover-pulse h-full rounded-2xl border border-ink-700 bg-ink-850/50 p-5">
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-neon/15 text-neon">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-display text-base font-bold text-fg">{v.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{v.body}</p>
          </div>
        </RevealItem>
      ))}
    </RevealStagger>
  )
}
