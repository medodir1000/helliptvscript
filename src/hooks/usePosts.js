import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured, POSTS_COLUMNS } from '../lib/supabase.js'

/** Published blog posts, newest first. */
export function usePosts(limit = 24) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let cancelled = false
    supabase
      .from('posts')
      .select(POSTS_COLUMNS)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (cancelled) return
        setPosts(data || [])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [limit])

  return { posts, loading }
}

/** A single post by slug. status: loading | ready | not-found | error | unconfigured */
export function usePost(slug) {
  const [post, setPost] = useState(null)
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
    setPost(null)

    supabase
      .from('posts')
      .select(POSTS_COLUMNS)
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('[usePost]', error)
          setStatus('error')
          return
        }
        if (!data) {
          setStatus('not-found')
          return
        }
        setPost(data)
        setStatus('ready')
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  return { post, status }
}
