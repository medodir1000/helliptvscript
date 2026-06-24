import { useCallback, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { site } from '../config/site.js'
import { getCategoryTheme } from '../utils/categories.js'

const LEAGUE_OPTIONS = ['World Cup', 'Premier League', 'La Liga', 'Champions League', 'NBA', 'WNBA']

const GEN_CATEGORIES = ['football', 'movies', 'series', 'entertainment', 'boxing', 'ufc', 'tennis', 'rugby', 'basketball']

const fmtTime = (ts) => {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return String(ts)
  }
}

// Maps the image generator returned by the Edge Function to a friendly label + cost tier.
const COVER_MODELS = {
  'gpt-image-1': { label: 'gpt-image-1', tier: 'paid · ~$0.06/img' },
  'dall-e-3': { label: 'DALL·E 3', tier: 'paid · ~$0.08/img' },
  pexels: { label: 'Pexels real photo', tier: 'free' },
  together: { label: 'Together FLUX', tier: 'free' },
  pollinations: { label: 'Pollinations FLUX', tier: 'free' },
}
function coverNote(image) {
  if (!image || !image.provider) return ''
  const m = COVER_MODELS[image.provider] || { label: image.provider, tier: '' }
  let s = ` · 🖼️ Cover: ${m.label}${m.tier ? ` (${m.tier})` : ''}`
  if (image.error) s += ` — note: OpenAI image fell back (${image.error})`
  return s
}

/** Coloured category pill (Movies, Combat, Entertainment, Football…). */
function CategoryBadge({ category }) {
  const theme = getCategoryTheme(category)
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider"
      style={{ background: `${theme.accent}1f`, color: theme.accent }}
    >
      {theme.label}
    </span>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErr(error.message)
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="glass mx-auto mt-24 max-w-sm space-y-4 rounded-2xl p-8">
      <h1 className="font-display text-2xl font-black text-fg">Admin sign in</h1>
      <input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-fg outline-none focus:border-neon/50"
      />
      <input
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-fg outline-none focus:border-neon/50"
      />
      {err && <p className="text-sm text-red-400">{err}</p>}
      <button
        disabled={busy}
        className="w-full rounded-lg bg-neon px-4 py-2.5 text-sm font-bold text-ink-950 transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-xs text-faint">Create an admin user in Supabase → Authentication → Users.</p>
    </form>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-faint">{label}</div>
      <div className={`mt-1 font-display text-3xl font-black ${accent ? 'text-neon' : 'text-fg'}`}>
        {value ?? '—'}
      </div>
    </div>
  )
}

/** Green monospaced console of recent ingest runs. */
function AutomationLogs({ runs }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-faint">
        Live automation logs
      </h2>
      <div className="glass max-h-72 overflow-y-auto rounded-2xl p-4 font-mono text-xs leading-relaxed">
        {runs.length === 0 ? (
          <p className="text-faint">No runs recorded yet — trigger an ingest below.</p>
        ) : (
          <ul className="space-y-1">
            {runs.map((r) => {
              const ok = r.status === 'ok'
              return (
                <li key={r.id} className={ok ? 'text-neon-soft' : 'text-red-400'}>
                  <span className="text-faint">[{fmtTime(r.created_at)}]</span>{' '}
                  {ok ? '✓' : '✗'} {r.source} ·{' '}
                  {r.leagues?.length ? r.leagues.join(', ') : 'all leagues'} · scanned {r.scanned} ·
                  upserted {r.upserted}
                  {r.message ? ` · ${r.message}` : ''}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

/** Tabular ledger of recent CTA clicks. */
function CtaLedger({ clicks }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-faint">
        Recent CTA activity
      </h2>
      <div className="glass overflow-hidden rounded-2xl">
        {clicks.length === 0 ? (
          <p className="p-4 text-sm text-faint">No CTA clicks recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[0.7rem] uppercase tracking-wider text-faint">
                <tr className="border-b border-ink-700">
                  <th className="px-4 py-2 font-semibold">Time</th>
                  <th className="px-4 py-2 font-semibold">Match / context</th>
                  <th className="px-4 py-2 font-semibold">Link</th>
                </tr>
              </thead>
              <tbody>
                {clicks.map((c, i) => (
                  <tr key={i} className="border-b border-ink-800/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-2 text-muted">{fmtTime(c.created_at)}</td>
                    <td className="px-4 py-2 text-fg">{c.event_title || '—'}</td>
                    <td className="max-w-xs truncate px-4 py-2 text-neon-soft">{c.href || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

/** IndexNow control room — status, auto-ping toggle, submission log, bulk re-submit. */
function IndexNowControlRoom() {
  const [status, setStatus] = useState(null)
  const [autoPing, setAutoPing] = useState(true)
  const [logs, setLogs] = useState([])
  const [bulkBusy, setBulkBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    try {
      const { data } = await supabase.from('index_settings').select('auto_ping').eq('id', 1).maybeSingle()
      setAutoPing(data?.auto_ping !== false)
    } catch {
      /* ignore */
    }
    try {
      const { data } = await supabase
        .from('index_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40)
      setLogs(data || [])
    } catch {
      /* ignore */
    }
    try {
      const { data } = await supabase.functions.invoke('index-now', { body: { action: 'status' } })
      if (data && !data.error) setStatus(data)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function toggle() {
    const next = !autoPing
    setAutoPing(next)
    await supabase
      .from('index_settings')
      .update({ auto_ping: next, updated_at: new Date().toISOString() })
      .eq('id', 1)
  }

  async function bulk() {
    setBulkBusy(true)
    setMsg(null)
    const { data, error } = await supabase.functions.invoke('index-now', { body: { action: 'bulk' } })
    setBulkBusy(false)
    if (error) setMsg(`Error: ${error.message}`)
    else if (data?.status === 'skipped') setMsg(data.message || 'Skipped — IndexNow key not set.')
    else if (data?.error) setMsg(`Error: ${data.error}`)
    else setMsg(`Submitted ${data?.submitted ?? 0} URL(s) — HTTP ${data?.http_code ?? '—'}`)
    load()
  }

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="text-sm font-bold uppercase tracking-widest text-faint">IndexNow settings</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line p-4">
          <div className="text-[0.7rem] font-bold uppercase tracking-wider text-faint">API key</div>
          <div
            className={`mt-1 text-sm font-semibold ${status?.keyConfigured ? 'text-neon' : 'text-red-500'}`}
          >
            {status
              ? status.keyConfigured
                ? 'Configured ✓'
                : 'Not set — add INDEXNOW_KEY secret'
              : 'Checking…'}
          </div>
          {status?.origin && <div className="mt-1 truncate text-xs text-faint">{status.origin}</div>}
        </div>
        <div className="rounded-xl border border-line p-4">
          <div className="text-[0.7rem] font-bold uppercase tracking-wider text-faint">
            Target engines
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(status?.engines || ['Bing', 'Yandex', 'Seznam']).map((e) => (
              <span
                key={e}
                className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent"
              >
                {e}
              </span>
            ))}
          </div>
          <div className="mt-1.5 text-xs text-faint">
            Google: via sitemap + crawl (not an IndexNow participant)
          </div>
        </div>
      </div>

      {status && !status.keyConfigured && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <span aria-hidden="true">⚠️</span>
          <span>
            To enable instant indexing, set your{' '}
            <strong className="font-semibold">INDEXNOW_KEY</strong> and{' '}
            <strong className="font-semibold">SITE_ORIGIN</strong> secrets in your Supabase dashboard.
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
        <div>
          <div className="text-sm font-semibold text-fg">Instant auto-ping</div>
          <div className="text-xs text-faint">Ping IndexNow automatically when a post is published.</div>
        </div>
        <button
          onClick={toggle}
          role="switch"
          aria-checked={autoPing}
          aria-label="Toggle instant auto-ping"
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${autoPing ? 'bg-neon' : 'bg-zinc-300'}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${autoPing ? 'left-[1.375rem]' : 'left-0.5'}`}
          />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={bulk}
          disabled={bulkBusy}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {bulkBusy ? 'Submitting…' : 'Force bulk index now'}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>

      <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-faint">Indexing logs</h3>
      <div className="glass max-h-64 overflow-y-auto rounded-xl p-3 font-mono text-xs leading-relaxed">
        {logs.length === 0 ? (
          <p className="text-faint">No submissions yet — publish a post or run a bulk index.</p>
        ) : (
          <ul className="space-y-1">
            {logs.map((l) => (
              <li key={l.id} className={l.ok ? 'text-neon-soft' : 'text-red-400'}>
                <span className="text-faint">[{fmtTime(l.created_at)}]</span> {l.url} → {l.target} HTTP{' '}
                {l.http_code ?? '—'} {l.ok ? '✓' : '✗'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function Dashboard({ session }) {
  const [stats, setStats] = useState({})
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [scope, setScope] = useState([])
  const [runs, setRuns] = useState([])
  const [clicks, setClicks] = useState([])
  const [drafts, setDrafts] = useState([])
  const [topic, setTopic] = useState('')
  const [genCat, setGenCat] = useState('football')
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [publishMsg, setPublishMsg] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [refreshingSug, setRefreshingSug] = useState(false)
  const [imgUrl, setImgUrl] = useState('')
  const [published, setPublished] = useState([])
  const [regenBusy, setRegenBusy] = useState(false)
  const [regenNote, setRegenNote] = useState('')
  const [trend, setTrend] = useState('')

  const load = useCallback(async () => {
    const count = async (tbl, mod) => {
      try {
        let q = supabase.from(tbl).select('*', { count: 'exact', head: true })
        if (mod) q = mod(q)
        const { count: c } = await q
        return c ?? 0
      } catch {
        return null
      }
    }
    const [fixtures, upcoming, posts, clickCount] = await Promise.all([
      count('fixtures'),
      count('fixtures', (q) => q.gte('date_time', new Date().toISOString())),
      count('posts'),
      count('cta_clicks'),
    ])
    let lastSync = null
    try {
      const { data } = await supabase
        .from('fixtures')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      lastSync = data?.created_at
    } catch {
      /* ignore */
    }
    setStats({ fixtures, upcoming, posts, clicks: clickCount, lastSync })

    try {
      const { data } = await supabase
        .from('ingest_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25)
      setRuns(data || [])
    } catch {
      /* ignore */
    }
    try {
      const { data } = await supabase
        .from('cta_clicks')
        .select('event_title, href, created_at')
        .order('created_at', { ascending: false })
        .limit(25)
      setClicks(data || [])
    } catch {
      /* ignore */
    }
    try {
      const { data } = await supabase
        .from('posts')
        .select('id, slug, title, category, status, created_at')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(25)
      setDrafts(data || [])
    } catch {
      /* ignore */
    }
    try {
      const { data } = await supabase
        .from('suggested_topics')
        .select('id, title, category, source, created_at')
        .order('created_at', { ascending: false })
        .limit(40)
      setSuggestions(data || [])
    } catch {
      /* ignore */
    }
    try {
      const { data } = await supabase
        .from('posts')
        .select('id, slug, title, category, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(30)
      setPublished(data || [])
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function toggleLeague(l) {
    setScope((s) => (s.includes(l) ? s.filter((x) => x !== l) : [...s, l]))
  }

  async function runIngest() {
    setRunning(true)
    setResult(null)
    const body = scope.length ? { leagues: scope } : {}
    const { data, error } = await supabase.functions.invoke('run-ingest', { body })
    setRunning(false)
    setResult(error ? `Error: ${error.message}` : typeof data === 'string' ? data : JSON.stringify(data))
    load()
  }

  async function generateDraft() {
    if (!topic.trim()) return
    setGenerating(true)
    setGenMsg(null)
    const { data, error } = await supabase.functions.invoke('generate-article', {
      body: { topic: topic.trim(), category: genCat },
    })
    setGenerating(false)
    if (error) setGenMsg(`Error: ${error.message}`)
    else if (data?.error) setGenMsg(`Error: ${data.error}`)
    else {
      setGenMsg(`Draft created: “${data?.post?.title || 'Untitled'}”. Review and publish it below.${coverNote(data?.image)}`)
      setTopic('')
      load()
    }
  }

  const setField = (k, v) => setEditForm((f) => ({ ...f, [k]: v }))

  async function openEditor(d) {
    setPublishMsg(null)
    const { data } = await supabase
      .from('posts')
      .select('id, title, excerpt, category, meta_description, tags, focus_keyword, body, cover_image, image_prompt')
      .eq('id', d.id)
      .maybeSingle()
    if (data) {
      setEditForm({
        title: data.title || '',
        category: data.category || 'football',
        excerpt: data.excerpt || '',
        meta_description: data.meta_description || '',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        focus_keyword: data.focus_keyword || '',
        cover_image: data.cover_image || '',
        image_prompt: data.image_prompt || '',
        body: data.body || '',
      })
      setEditingId(d.id)
    }
  }

  async function saveEdit() {
    if (!editingId) return
    setSavingEdit(true)
    await supabase
      .from('posts')
      .update({
        title: editForm.title,
        excerpt: editForm.excerpt || null,
        meta_description: editForm.meta_description || null,
        tags: editForm.tags
          ? editForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : null,
        focus_keyword: editForm.focus_keyword || null,
        cover_image: editForm.cover_image || null,
        image_prompt: editForm.image_prompt || null,
        body: editForm.body,
      })
      .eq('id', editingId)
    setSavingEdit(false)
    load()
  }

  function insertImage() {
    const u = imgUrl.trim()
    if (!u) return
    setField('body', `${editForm.body || ''}\n\n![image](${u})\n`)
    setImgUrl('')
  }

  async function regenerateCover() {
    if (!editForm?.image_prompt?.trim()) return
    setRegenBusy(true)
    setRegenNote('')
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: { prompt: editForm.image_prompt },
    })
    setRegenBusy(false)
    if (error) setRegenNote(`Error: ${error.message}`)
    else if (data?.url) {
      setField('cover_image', data.url)
      setRegenNote(coverNote(data).replace(/^ · /, ''))
    }
  }

  async function publishPost(id) {
    setPublishMsg(null)
    const { data, error } = await supabase.functions.invoke('publish-post', { body: { id } })
    if (error) setPublishMsg(`Error: ${error.message}`)
    else if (data?.error) setPublishMsg(`Error: ${data.error}`)
    else setPublishMsg(`Published ✓ — IndexNow: ${data?.indexnow || '—'}`)
    setEditingId(null)
    load()
  }

  async function refreshSuggestions() {
    setRefreshingSug(true)
    await supabase.functions.invoke('suggest-topics', { body: {} })
    setRefreshingSug(false)
    load()
  }

  async function generateFromTrend() {
    if (!trend.trim()) return
    setGenerating(true)
    setGenMsg(null)
    const { data, error } = await supabase.functions.invoke('generate-article', {
      body: { topic: trend.trim(), category: genCat },
    })
    setGenerating(false)
    if (error) setGenMsg(`Error: ${error.message}`)
    else if (data?.error) setGenMsg(`Error: ${data.error}`)
    else {
      setGenMsg(`Draft created: “${data?.post?.title || trend}”. Review the facts in Drafts before publishing.${coverNote(data?.image)}`)
      setTrend('')
    }
    load()
  }

  async function generateFromSuggestion(s) {
    setGenerating(true)
    setGenMsg(null)
    const { data, error } = await supabase.functions.invoke('generate-article', {
      body: { topic: s.title, category: s.category || 'football' },
    })
    setGenerating(false)
    if (error) setGenMsg(`Error: ${error.message}`)
    else if (data?.error) setGenMsg(`Error: ${data.error}`)
    else {
      setGenMsg(`Draft created: “${data?.post?.title || s.title}”. Review it in Drafts.${coverNote(data?.image)}`)
      await supabase.from('suggested_topics').delete().eq('id', s.id)
    }
    load()
  }

  async function dismissSuggestion(id) {
    await supabase.from('suggested_topics').delete().eq('id', id)
    load()
  }

  async function deletePost(id) {
    if (!window.confirm('Delete this post permanently? This cannot be undone.')) return
    await supabase.from('posts').delete().eq('id', id)
    if (editingId === id) setEditingId(null)
    load()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-fg">Admin</h1>
          <p className="text-sm text-faint">{session.user?.email}</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-lg border border-ink-700 px-4 py-2 text-sm text-muted transition hover:text-fg"
        >
          Sign out
        </button>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-faint">Ingest status</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Fixtures" value={stats.fixtures} />
          <Stat label="Upcoming" value={stats.upcoming} accent />
          <Stat label="Blog posts" value={stats.posts} />
          <Stat
            label="Last sync"
            value={stats.lastSync ? new Date(stats.lastSync).toLocaleString() : '—'}
          />
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-faint">Manual ingest</h2>
        <p className="mt-1 text-sm text-muted">
          Scope the run to specific competitions, or leave all unselected to ingest everything.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {LEAGUE_OPTIONS.map((l) => {
            const on = scope.includes(l)
            return (
              <button
                key={l}
                onClick={() => toggleLeague(l)}
                aria-pressed={on}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  on
                    ? 'border-neon/60 bg-neon/15 text-neon-soft'
                    : 'border-ink-700 text-muted hover:text-fg'
                }`}
              >
                {l}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={runIngest}
            disabled={running}
            className="rounded-xl bg-neon px-5 py-2.5 text-sm font-bold text-ink-950 transition hover:brightness-110 disabled:opacity-60"
          >
            {running ? 'Running ingest…' : scope.length ? `Run ingest (${scope.length})` : 'Run ingest now'}
          </button>
          <span className="text-xs text-faint">{scope.length ? scope.join(', ') : 'All leagues'}</span>
        </div>
        {result && (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-ink-900 p-3 text-xs text-muted">
            {result}
          </pre>
        )}
      </section>

      <AutomationLogs runs={runs} />

      {/* Suggested topics — from your own fixtures (no news scraping) */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-faint">
            Suggested topics ({suggestions.length})
          </h2>
          <button
            onClick={refreshSuggestions}
            disabled={refreshingSug}
            className="rounded-lg border border-ink-700 px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-fg disabled:opacity-60"
          >
            {refreshingSug ? 'Refreshing…' : 'Refresh from fixtures'}
          </button>
        </div>

        {/* Manual topic intake → reviewed draft (verify any breaking news first) */}
        <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-line bg-surface-2 p-3 sm:flex-row sm:items-center">
          <input
            value={trend}
            onChange={(e) => setTrend(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') generateFromTrend()
            }}
            placeholder="🔥 Inject a topic to cover (you verify the facts)…"
            className="flex-1 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-fg outline-none focus:border-neon/50"
          />
          <button
            onClick={generateFromTrend}
            disabled={generating || !trend.trim()}
            className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {generating ? 'Generating…' : 'Transform & Generate'}
          </button>
        </div>

        <div className="glass max-h-72 overflow-y-auto rounded-2xl">
          {suggestions.length === 0 ? (
            <p className="p-4 text-sm text-faint">
              No suggestions yet — click “Refresh from fixtures” to build topic ideas from upcoming
              matches.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {suggestions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{s.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <CategoryBadge category={s.category} />
                      <span className="text-xs text-faint">{s.source}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => generateFromSuggestion(s)}
                      disabled={generating}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                    >
                      Generate draft
                    </button>
                    <button
                      onClick={() => dismissSuggestion(s.id)}
                      className="rounded-lg border border-ink-700 px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-fg"
                    >
                      Dismiss
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* AI draft generator — server-side OpenRouter; saves drafts for human review */}
      <section className="glass rounded-2xl p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-faint">Content studio</h2>
        <p className="mt-1 text-sm text-muted">
          Generate a draft article with AI. It saves as{' '}
          <strong className="font-semibold text-fg">draft</strong> — you review and publish it.
          Nothing goes live automatically.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic or working title…"
            className="flex-1 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-fg outline-none focus:border-neon/50"
          />
          <select
            value={genCat}
            onChange={(e) => setGenCat(e.target.value)}
            className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-fg outline-none"
          >
            {GEN_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={generateDraft}
            disabled={generating || !topic.trim()}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {generating ? 'Generating…' : 'Generate draft'}
          </button>
        </div>
        {genMsg && <p className="mt-3 text-sm text-muted">{genMsg}</p>}
      </section>

      {/* Draft review + publish */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-faint">
          Drafts ({drafts.length})
        </h2>
        <div className="glass overflow-hidden rounded-2xl">
          {drafts.length === 0 ? (
            <p className="p-4 text-sm text-faint">No drafts yet — generate one above.</p>
          ) : (
            <ul className="divide-y divide-line">
              {drafts.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-fg">{d.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <CategoryBadge category={d.category} />
                      <span className="text-xs text-faint">{fmtTime(d.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => openEditor(d)}
                      className="rounded-lg border border-ink-700 px-3 py-1.5 text-xs font-semibold text-muted transition hover:-translate-y-0.5 hover:text-fg"
                    >
                      ✏️ Edit
                    </button>
                    <a
                      href={`/blog/${d.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-ink-700 px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-fg"
                    >
                      Preview
                    </a>
                    <button
                      onClick={() => publishPost(d.id)}
                      className="rounded-lg bg-neon px-3 py-1.5 text-xs font-bold text-ink-950 transition hover:brightness-110"
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => deletePost(d.id)}
                      aria-label="Delete draft"
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:-translate-y-0.5 hover:bg-red-500 hover:text-white"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Published posts — edit or delete live articles */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-faint">
          Published posts ({published.length})
        </h2>
        <div className="glass overflow-hidden rounded-2xl">
          {published.length === 0 ? (
            <p className="p-4 text-sm text-faint">No published posts yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {published.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-fg">{p.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <CategoryBadge category={p.category} />
                      <span className="text-xs text-faint">{fmtTime(p.published_at)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => openEditor(p)}
                      className="rounded-lg border border-ink-700 px-3 py-1.5 text-xs font-semibold text-muted transition hover:-translate-y-0.5 hover:text-fg"
                    >
                      ✏️ Edit
                    </button>
                    <a
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-ink-700 px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-fg"
                    >
                      View
                    </a>
                    <button
                      onClick={() => deletePost(p.id)}
                      aria-label="Delete post"
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:-translate-y-0.5 hover:bg-red-500 hover:text-white"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {editingId && editForm && (
        <section className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-faint">Edit post</h2>
            <button
              onClick={() => setEditingId(null)}
              className="text-xs font-semibold text-faint transition hover:text-fg"
            >
              Close
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-faint">Title</span>
              <input
                value={editForm.title}
                onChange={(e) => setField('title', e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-fg outline-none focus:border-neon/50"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-faint">Meta description</span>
              <input
                value={editForm.meta_description}
                onChange={(e) => setField('meta_description', e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-fg outline-none focus:border-neon/50"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-faint">Tags (comma-separated)</span>
                <input
                  value={editForm.tags}
                  onChange={(e) => setField('tags', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-fg outline-none focus:border-neon/50"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-faint">Focus keyword</span>
                <input
                  value={editForm.focus_keyword}
                  onChange={(e) => setField('focus_keyword', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-fg outline-none focus:border-neon/50"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-faint">Cover image URL</span>
              <input
                value={editForm.cover_image}
                onChange={(e) => setField('cover_image', e.target.value)}
                placeholder="https://…/cover.jpg"
                className="mt-1 w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-fg outline-none focus:border-neon/50"
              />
            </label>

            {/* AI Image Studio — editable prompt + regenerate */}
            <div className="rounded-xl border border-line bg-surface-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-faint">
                  AI Image Studio
                </span>
                <button
                  type="button"
                  onClick={regenerateCover}
                  disabled={regenBusy || !editForm.image_prompt?.trim()}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {regenBusy ? 'Generating…' : '🔄 Regenerate cover image'}
                </button>
              </div>
              {regenNote && <p className="mt-2 text-[0.7rem] text-faint">{regenNote}</p>}
              {editForm.cover_image && (
                <div className="relative mt-3 aspect-[16/9] w-full overflow-hidden rounded-xl border border-line">
                  <img src={editForm.cover_image} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1.5 p-4">
                    <span
                      className="rounded px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white shadow"
                      style={{ background: getCategoryTheme(editForm.category).accent }}
                    >
                      {getCategoryTheme(editForm.category).label}
                    </span>
                    <h3 className="line-clamp-2 font-display text-2xl font-black uppercase leading-[1.05] tracking-tighter text-white drop-shadow-xl md:text-4xl">
                      {editForm.title}
                    </h3>
                  </div>
                </div>
              )}
              <label className="mt-3 block">
                <span className="text-xs font-semibold text-faint">Image prompt (editable)</span>
                <textarea
                  value={editForm.image_prompt}
                  onChange={(e) => setField('image_prompt', e.target.value)}
                  rows={3}
                  placeholder="Describe the cover image…"
                  className="mt-1 w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 font-mono text-xs leading-relaxed text-fg outline-none focus:border-neon/50"
                />
              </label>
            </div>

            <div>
              <span className="text-xs font-semibold text-faint">Insert image into body</span>
              <div className="mt-1 flex gap-2">
                <input
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  placeholder="https://…/image.jpg"
                  className="flex-1 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-fg outline-none focus:border-neon/50"
                />
                <button
                  type="button"
                  onClick={insertImage}
                  className="shrink-0 rounded-lg border border-ink-700 px-3 text-xs font-semibold text-muted transition hover:text-fg"
                >
                  Insert
                </button>
              </div>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-faint">Excerpt</span>
              <textarea
                value={editForm.excerpt}
                onChange={(e) => setField('excerpt', e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-fg outline-none focus:border-neon/50"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-faint">Body (markdown)</span>
              <textarea
                value={editForm.body}
                onChange={(e) => setField('body', e.target.value)}
                rows={16}
                className="mt-1 w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 font-mono text-xs leading-relaxed text-fg outline-none focus:border-neon/50"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={saveEdit}
              disabled={savingEdit}
              className="rounded-xl border border-ink-700 px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-accent/50 disabled:opacity-60"
            >
              {savingEdit ? 'Saving…' : 'Save draft'}
            </button>
            <button
              onClick={() => publishPost(editingId)}
              className="rounded-xl bg-neon px-5 py-2.5 text-sm font-bold text-ink-950 transition hover:brightness-110"
            >
              Publish &amp; Index Now
            </button>
          </div>
          {publishMsg && <p className="mt-3 text-sm text-muted">{publishMsg}</p>}
        </section>
      )}

      {publishMsg && !editingId && <p className="text-sm text-muted">{publishMsg}</p>}

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-faint">
          CTA conversions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="CTA clicks (total)" value={stats.clicks} accent />
        </div>
      </section>

      <CtaLedger clicks={clicks} />

      <IndexNowControlRoom />
    </div>
  )
}

export default function AdminPage() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null)
      return
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 py-10 sm:px-6">
      <Helmet>
        <title>{`Admin | ${site.brand}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {!isSupabaseConfigured ? (
        <p className="mt-24 text-center text-sm text-amber-300">Supabase is not configured.</p>
      ) : session === undefined ? (
        <p className="mt-24 text-center text-sm text-faint">Loading…</p>
      ) : session ? (
        <Dashboard session={session} />
      ) : (
        <Login />
      )}
    </div>
  )
}
