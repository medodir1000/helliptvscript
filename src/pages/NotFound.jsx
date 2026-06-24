import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
      <Helmet>
        <title>Event not found</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <span className="text-6xl font-extrabold text-accent">404</span>
      <h1 className="mt-4 text-xl font-bold text-fg">We couldn&apos;t find that event</h1>
      <p className="mt-2 text-sm text-muted">
        The event may have ended or the link may be incorrect.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-fg transition hover:brightness-110"
      >
        Browse upcoming events
      </Link>
    </div>
  )
}
