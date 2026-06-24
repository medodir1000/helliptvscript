import { Helmet } from 'react-helmet-async'

/**
 * Injects per-route <title>, meta description, Open Graph/Twitter tags, the
 * canonical link, html[lang], and JSON-LD structured data into the document
 * head.
 *
 * Note: this is client-side head management. Googlebot renders JS and will see
 * it, but for maximum indexing coverage (and other crawlers) serve prerendered
 * HTML — see README "SEO / prerendering".
 */
export default function Seo({ title, description, canonical, lang, jsonLd, image }) {
  return (
    <Helmet prioritizeSeoTags>
      {lang && <html lang={lang} />}
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canonical && <meta property="og:url" content={canonical} />}
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  )
}
