import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured, FIXTURE_COLUMNS } from '../lib/supabase.js'

/**
 * Fetch up to `limit` upcoming fixtures in the same category (excluding the
 * current slug), ordered by start time. Powers the internal-linking block that
 * lets crawlers (and users) discover related events.
 */
export function useRelatedFixtures(category, currentSlug, limit = 4) {
  const [related, setRelated] = useState([])

  useEffect(() => {
    if (!isSupabaseConfigured || !category) {
      setRelated([])
      return
    }

    let cancelled = false
    const nowISO = new Date().toISOString()

    let query = supabase
      .from('fixtures')
      .select(FIXTURE_COLUMNS)
      .eq('category', category)
      .gte('date_time', nowISO)
      .order('date_time', { ascending: true })
      .limit(limit + 1) // fetch one extra in case the current event is included

    if (currentSlug) query = query.neq('slug', currentSlug)

    query.then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        console.error('[useRelatedFixtures]', error)
        setRelated([])
        return
      }
      setRelated((data || []).slice(0, limit))
    })

    return () => {
      cancelled = true
    }
  }, [category, currentSlug, limit])

  return related
}
