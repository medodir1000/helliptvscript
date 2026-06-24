// ===========================================================================
// Supabase Edge Function: generate-article
// Admin-triggered AI draft generator (OpenRouter). The API key lives ONLY in a
// server-side secret (OPENROUTER_API_KEY) — never in the frontend bundle.
//
// It generates ONE draft per call for an admin-supplied topic and saves it with
// status='draft'. It does NOT publish and does NOT submit to any search engine —
// a human reviews and publishes from /admin.
//
// Auth: verify_jwt=false (so the CORS preflight passes) + in-function getUser()
// so only a signed-in admin can call it.
// ===========================================================================
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type, x-supabase-api-version'
const corsFor = (req: Request) => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': req.headers.get('Access-Control-Request-Headers') ?? ALLOW_HEADERS,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
})

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 70)
  return `${base || 'article'}-${Date.now().toString(36).slice(-5)}`
}

const SYSTEM = `You are an expert sports and streaming journalist writing for HellIPTV, an honest 'where to watch' guide.
Rules:
- Write accurate, original, genuinely useful content in a natural human voice. Never copy or closely paraphrase another article; do NOT invent statistics, quotes, final scores, prices or reviews.
- Recommend OFFICIAL / licensed broadcasters and legal ways to watch. Never claim piracy is legal or imply it.
- Optimise naturally for high-intent keywords (where to watch, live stream, TV channel, kickoff time) — no keyword stuffing.
- Use clear structure with ## (h2) and ### (h3) markdown headings and short, readable paragraphs.
Return ONLY valid minified JSON (no markdown fences, no commentary).`

const userPrompt = (topic: string, category: string) =>
  `Write a comprehensive, in-depth, ~1500-2200 word article with real editorial depth (background, context, viewing options by region, practical viewing tips, and a clear where-to-watch conclusion).
Topic: ${topic}
Category: ${category}

TITLE: craft ONE varied, high-intent, clickable journalistic headline. Do NOT default to a 'Where to watch...' template - rotate between these styles, picking whichever fits the topic best:
- Breaking Hook: Blockbuster [News]: Inside the [Event] and How to Watch the Fallout Live
- Ultimate Guide: How to Safely Stream [Topic or Event] Online Tonight Without Cable
- Cinematic Update: [Show or Movie] Latest Broadcast Guide - Release Schedule & Official Options
- The Showdown: [Team or Player A] vs [Team or Player B]: Complete Live Coverage & Form Analysis
- Battle: [Team A] vs [Team B]: Live Streaming Guide, Kickoff Time & Squad Preview
- Legal Access: [Event] Live Stream - How to Legally Watch from Canada, the UK or Europe
Keep the title accurate and honest - it must match the real topic and never overpromise; do not assert unverified news (trades/transfers) as confirmed fact.

Return a JSON object with these keys:
- title (string)
- focus_keyword (string)
- meta_description (string, max 160 characters)
- excerpt (string, max 200 characters)
- tags (array of 5-8 lowercase strings)
- body_markdown (string: an intro, several ## sections with some ### subsections, and a final '## Where to watch' section pointing to official broadcasters)
- faq (array of 3-5 objects, each with keys q and a)`

Deno.serve(async (req: Request) => {
  const cors = corsFor(req)
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  const model = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini'

  // Admin-only.
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const { data: userData, error: authErr } = await createClient(url, anonKey).auth.getUser(token)
  if (authErr || !userData?.user) return json({ error: 'Unauthorized - admin sign-in required' }, 401)

  if (!openaiKey) {
    return json(
      { error: 'OPENAI_API_KEY is not set. Add it as an Edge Function secret first.' },
      400,
    )
  }

  let topic = ''
  let category = 'football'
  try {
    const body = await req.json()
    topic = String(body?.topic || '').trim()
    category = String(body?.category || 'football').trim().toLowerCase()
  } catch {
    /* no body */
  }
  if (!topic) return json({ error: 'A topic is required.' }, 400)

  let parsed: any
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userPrompt(topic, category) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 6000,
      }),
    })
    const data = await r.json()
    if (!r.ok) {
      return json({ error: `OpenAI ${r.status}: ${data?.error?.message || JSON.stringify(data).slice(0, 300)}` }, 502)
    }
    const content = data?.choices?.[0]?.message?.content
    if (!content) return json({ error: 'No content returned by the model.' }, 502)
    parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content))
  } catch (e) {
    return json({ error: `Generation failed: ${e instanceof Error ? e.message : String(e)}` }, 502)
  }

  const title = String(parsed.title || topic).slice(0, 200)

  // ---- Featured image (built server-side; no token ever reaches the frontend) ----
  const seed = Date.now() % 1000000
  const SPORTS = ['football', 'basketball', 'tennis', 'rugby', 'boxing', 'ufc', 'mma', 'combat', 'motorsport']
  const isSport = SPORTS.includes(category)

  // Asset-based mapping: a CONCRETE, category-matched scene (never an abstract
  // phrase from the title/keyword, which yields random/irrelevant art).
  const SCENE: Record<string, string> = {
    football: `Premium photo-realistic wide-angle shot of a modern football stadium under dramatic neon floodlights, empty pitch, cinematic sports broadcast coverage style, depth of field, 16:9, no text, no watermark`,
    basketball: `Premium hyper-realistic wide-angle capture of a professional glossy indoor basketball court arena, glowing neon hoops, dramatic overhead arena lighting, cinematic media broadcast coverage style, 16:9, no text, no watermark`,
    tennis: `Premium photo-realistic wide-angle shot of a floodlit tennis stadium court, empty court, cinematic sports broadcast style, 16:9, no text, no watermark`,
    rugby: `Premium photo-realistic wide-angle shot of a floodlit rugby stadium, empty pitch, cinematic sports broadcast style, 16:9, no text, no watermark`,
    boxing: `Premium photo-realistic wide-angle shot of a boxing arena with a brightly lit empty ring under dramatic spotlights, cinematic broadcast style, 16:9, no text, no watermark`,
    ufc: `Premium photo-realistic wide-angle shot of an MMA arena with a brightly lit empty octagon under dramatic spotlights, cinematic broadcast style, 16:9, no text, no watermark`,
    mma: `Premium photo-realistic wide-angle shot of an MMA arena with a brightly lit empty octagon under dramatic spotlights, cinematic broadcast style, 16:9, no text, no watermark`,
    combat: `Premium photo-realistic wide-angle shot of a combat sports arena under dramatic spotlights, cinematic broadcast style, 16:9, no text, no watermark`,
    motorsport: `Premium photo-realistic wide-angle shot of a floodlit motorsport race track and grandstand, cinematic broadcast style, 16:9, no text, no watermark`,
  }
  const ENTERTAINMENT = `Premium luxury home theater and dark-ambient entertainment media center with a massive glowing Smart TV showing cinematic ambient light, modern interior, neon ambient backlighting, luxury tech magazine aesthetics, 16:9, no text, no watermark`
  const imagePrompt = isSport ? SCENE[category] || SCENE.football : ENTERTAINMENT

  let coverImage: string | null = null

  // 1) Sports fixtures: prefer an authentic stadium / atmosphere photo from Pexels.
  const pexelsKey = Deno.env.get('PEXELS_API_KEY')
  if (isSport && pexelsKey) {
    const PEXELS_Q: Record<string, string> = {
      football: 'football stadium crowd floodlights',
      basketball: 'basketball arena',
      tennis: 'tennis stadium court',
      boxing: 'boxing ring arena',
      ufc: 'fight arena lights',
      mma: 'fight arena lights',
      combat: 'fight arena lights',
      rugby: 'rugby stadium',
      motorsport: 'race track grandstand',
    }
    try {
      const q = encodeURIComponent(PEXELS_Q[category] || `${category} stadium`)
      const pr = await fetch(
        `https://api.pexels.com/v1/search?query=${q}&orientation=landscape&size=large&per_page=15`,
        { headers: { Authorization: pexelsKey } },
      )
      const pdata = await pr.json()
      const photos = Array.isArray(pdata?.photos) ? pdata.photos : []
      if (photos.length) {
        const pick = photos[seed % photos.length]
        coverImage = pick?.src?.landscape || pick?.src?.large2x || pick?.src?.large || null
      }
    } catch (_e) {
      /* fall through to the editorial poster */
    }
  }

  // 2) Otherwise: generate a realistic AI cover from the prompt above
  //    (Together if configured, else Pollinations).
  if (!coverImage) {
    const togetherKey = Deno.env.get('TOGETHER_API_KEY')
    if (Deno.env.get('IMAGE_PROVIDER') === 'together' && togetherKey) {
      try {
        const ir = await fetch('https://api.together.xyz/v1/images/generations', {
          method: 'POST',
          headers: { Authorization: `Bearer ${togetherKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: Deno.env.get('TOGETHER_IMAGE_MODEL') || 'black-forest-labs/FLUX.1-schnell-Free',
            prompt: imagePrompt,
            width: 1200,
            height: 675,
            n: 1,
          }),
        })
        const idata = await ir.json()
        const u = idata?.data?.[0]?.url
        if (u) coverImage = String(u)
      } catch (_e) {
        /* keep the Pollinations fallback */
      }
    }
    if (!coverImage) {
      coverImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1200&height=675&nologo=true&model=flux&seed=${seed}`
    }
  }

  const row = {
    slug: slugify(title),
    title,
    excerpt: parsed.excerpt ? String(parsed.excerpt).slice(0, 300) : null,
    body: String(parsed.body_markdown || ''),
    category,
    meta_description: parsed.meta_description ? String(parsed.meta_description).slice(0, 300) : null,
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 10) : null,
    focus_keyword: parsed.focus_keyword ? String(parsed.focus_keyword) : null,
    faq: Array.isArray(parsed.faq) ? parsed.faq.slice(0, 8) : null,
    model,
    status: 'draft',
    author: 'HellIPTV Editorial',
    cover_image: coverImage,
    image_prompt: imagePrompt,
    published_at: null,
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { data: ins, error } = await supabase
    .from('posts')
    .insert(row)
    .select('id, slug, title, status')
    .single()
  if (error) return json({ error: error.message }, 500)

  return json({ ok: true, post: ins })
})
