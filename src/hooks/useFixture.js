import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured, FIXTURE_COLUMNS } from '../lib/supabase.js'

/**
 * Fetch a single fixture by slug.
 * Returns { fixture, status } where status is one of:
 *   'loading' | 'ready' | 'not-found' | 'error' | 'unconfigured'
 */
export function useFixture(slug) {
  const [fixture, setFixture] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('unconfigured')
      return
    }
    if (!slug) {
      setStatus('not-found')
      return
    }

    let cancelled = false
    setStatus('loading')
    setFixture(null)

    supabase
      .from('fixtures')
      .select(FIXTURE_COLUMNS)
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('[useFixture]', error)
          setStatus('error')
          return
        }
        if (!data) {
          setStatus('not-found')
          return
        }
        setFixture(data)
        setStatus('ready')
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  return { fixture, status }
}
