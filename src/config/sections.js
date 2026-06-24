/**
 * Magazine content sections — drive the header nav, the category routes
 * (/football, /movies-series, …) and the home-page category grids.
 * `cats` lists the post.category values that belong in each section.
 */
export const SECTIONS = [
  { slug: 'football', label: 'Football', cats: ['football'], sport: true },
  { slug: 'movies-series', label: 'Movies & Series', cats: ['movies', 'series', 'entertainment'] },
  { slug: 'combat-sports', label: 'Combat Sports', cats: ['boxing', 'ufc', 'mma', 'combat'], sport: true },
  { slug: 'tennis-rugby', label: 'Tennis & Rugby', cats: ['tennis', 'rugby'], sport: true },
]

export const SECTION_BY_SLUG = Object.fromEntries(SECTIONS.map((s) => [s.slug, s]))

/** True when a post belongs to a section (case-insensitive category match). */
export function postInSection(post, section) {
  const c = String(post?.category || '').toLowerCase()
  return section.cats.includes(c)
}
