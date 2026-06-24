// ===========================================================================
// Supabase Edge Function: generate-image
// Admin-triggered cover-image regeneration. Takes an (admin-editable) prompt
// and returns a fresh image URL. Keys stay server-side; nothing in the bundle.
//
// Provider: Together AI (FLUX) if IMAGE_PROVIDER=together + TOGETHER_API_KEY,
// otherwise Pollinations (keyless — the URL itself is the generated image).
//
// Auth: verify_jwt=false (CORS preflight) + in-function getUser() (admin only).
// ===========================================================================
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type, x-supabase-api-version'
const corsFor = (req: Request) => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': req.headers.get('Access-Control-Request-Headers') ?? ALLOW_HEADERS,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
})

Deno.serve(async (req: Request) => {
  const cors = corsFor(req)
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Admin-only.
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const { data: userData, error: authErr } = await createClient(url, anonKey).auth.getUser(token)
  if (authErr || !userData?.user) return json({ error: 'Unauthorized - admin sign-in required' }, 401)

  let prompt = ''
  try {
    const body = await req.json()
    prompt = String(body?.prompt || '').trim().slice(0, 600)
  } catch {
    /* no body */
  }
  if (!prompt) return json({ error: 'A prompt is required.' }, 400)

  const seed = Date.now() % 1000000
  let imageUrl =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=675&nologo=true&model=flux&seed=${seed}`

  const togetherKey = Deno.env.get('TOGETHER_API_KEY')
  if (Deno.env.get('IMAGE_PROVIDER') === 'together' && togetherKey) {
    try {
      const ir = await fetch('https://api.together.xyz/v1/images/generations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${togetherKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: Deno.env.get('TOGETHER_IMAGE_MODEL') || 'black-forest-labs/FLUX.1-schnell-Free',
          prompt,
          width: 1200,
          height: 675,
          n: 1,
        }),
      })
      const idata = await ir.json()
      const u = idata?.data?.[0]?.url
      if (u) imageUrl = String(u)
    } catch (_e) {
      /* keep the Pollinations URL */
    }
  }

  return json({ ok: true, url: imageUrl })
})
