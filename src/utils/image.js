// ===========================================================================
// Image helpers — serve Supabase Storage covers through the image-transform
// endpoint so a ~1.9 MB original is delivered resized + recompressed (~140 KB),
// and pick the right size per breakpoint. Non-Supabase URLs pass through.
// ===========================================================================

const PUBLIC_MARKER = '/storage/v1/object/public/'
const RENDER_MARKER = '/storage/v1/render/image/public/'

/** True for a Supabase Storage public object URL (resizable via the render API). */
export function isSupabaseStorage(url) {
  return typeof url === 'string' && url.includes(PUBLIC_MARKER)
}

/**
 * Optimised image URL. Supabase Storage public objects are routed through the
 * transform endpoint (resize + recompress; the API auto-serves webp/avif to
 * supporting browsers). Pexels / Pollinations URLs pass through unchanged.
 */
export function optimizedImage(url, { width = 1280, quality = 72 } = {}) {
  if (!isSupabaseStorage(url)) return url
  const rendered = url.replace(PUBLIC_MARKER, RENDER_MARKER)
  const sep = rendered.includes('?') ? '&' : '?'
  return `${rendered}${sep}width=${width}&quality=${quality}`
}

/** A responsive `srcset` across common widths for a Supabase cover (else undefined). */
export function coverSrcSet(url, widths = [640, 960, 1280], quality = 72) {
  if (!isSupabaseStorage(url)) return undefined
  return widths.map((w) => `${optimizedImage(url, { width: w, quality })} ${w}w`).join(', ')
}
