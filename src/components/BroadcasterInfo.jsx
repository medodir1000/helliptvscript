import CtaButton from './CtaButton.jsx'

/**
 * "Where to watch" card. Surfaces the OFFICIAL broadcaster from the fixture
 * data (this is also what the JSON-LD advertises). The CTA is a separate,
 * clearly-labelled support link — not presented as the official stream.
 */
export default function BroadcasterInfo({ fixture }) {
  return (
    <section className="rounded-2xl border border-ink-700 bg-ink-850/60 p-5 sm:p-6">
      <h2 className="text-lg font-bold text-fg">Where to watch</h2>

      {fixture.broadcaster ? (
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent-soft">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="13" rx="2" />
              <path d="m8 3 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-faint">Official broadcaster</div>
            <div className="text-base font-semibold text-fg">{fixture.broadcaster}</div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Official broadcaster to be confirmed for this event.
        </p>
      )}

      <p className="mt-4 text-sm text-muted">
        Check the official broadcaster for your region first. Need help getting set up or finding an
        option in your area?
      </p>

      <div className="mt-4">
        <CtaButton eventTitle={fixture.event_title} variant="outline" />
      </div>
    </section>
  )
}
