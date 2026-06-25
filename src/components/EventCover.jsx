import { useState } from 'react'
import { getCategoryTheme } from '../utils/categories.js'
import { optimizedImage, coverSrcSet } from '../utils/image.js'

/**
 * Poster-style cover. A category-coloured base (or the real/AI photo) with a
 * dark gradient and the title + category badge overlaid, ESPN/Netflix style.
 * The image fades in over the base; the gradient stays as the fallback.
 * Pass `overlay={false}` where the title is rendered elsewhere (article h1).
 */
export default function EventCover({ fixture, featured = false, overlay = true, priority = false }) {
  const theme = getCategoryTheme(fixture.category)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const imgSrc = optimizedImage(fixture.image_url, { width: featured ? 1280 : 768 })
  const imgSrcSet = coverSrcSet(fixture.image_url)
  const imgSizes = featured ? '(min-width: 1024px) 1024px, 100vw' : '(min-width: 640px) 400px, 100vw'

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Coloured base — instant, and the fallback while the image loads. */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${theme.accent} 0%, #0b0b12 82%)` }}
      />

      {fixture.image_url && !failed && (
        <img
          src={imgSrc}
          srcSet={imgSrcSet}
          sizes={imgSrcSet ? imgSizes : undefined}
          alt={fixture.event_title}
          loading={priority ? 'eager' : 'lazy'}
          {...(priority ? { fetchpriority: 'high' } : {})}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            priority || loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {overlay && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1.5 p-4 sm:p-5">
            <span
              className="rounded px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white shadow"
              style={{ background: theme.accent }}
            >
              {theme.label}
            </span>
            <h3
              className={`font-display font-black uppercase leading-[1.05] tracking-tighter text-white drop-shadow-xl ${
                featured ? 'line-clamp-3 text-2xl md:text-4xl' : 'line-clamp-2 text-base sm:text-lg'
              }`}
            >
              {fixture.event_title}
            </h3>
          </div>
        </>
      )}
    </div>
  )
}
