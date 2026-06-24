import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * True when both Supabase env vars are present. The UI uses this to render a
 * friendly "not configured" state instead of throwing on a null client.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: false },
    })
  : null

/** Columns we read from the `fixtures` table, kept in one place. */
export const FIXTURE_COLUMNS =
  'id, slug, event_title, broadcaster, date_time, language, category, competition, event_ref, content_cache'

/** Columns we read from the `posts` (blog) table. */
export const POSTS_COLUMNS =
  'id, slug, title, excerpt, body, category, cover_image, author, published_at, status, meta_description, tags, focus_keyword, faq'
