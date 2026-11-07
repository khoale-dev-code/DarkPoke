import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { EXPANSION_ID, scrydexExpansionTag } from '@/features/card-library/server/scrydex'
import { verifyScrydexSignature } from '@/features/card-library/server/scrydex-signature'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Scrydex webhook (https://scrydex.com/docs/getting-started/webhooks).
 * Header: X-Scrydex-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256("<t>.<raw body>", SCRYDEX_WEBHOOK_SECRET)>
 * Events: pokemon.expansions.prices.raw_updated | prices.graded_updated | pop_reports.updated
 * Body: { "id": "evt_…", "name": "<event>", "data": { "expansion_ids": ["sv1", …] } }
 * The handler only expires cache tags, so repeated deliveries are harmless.
 */
const MAX_BODY = 64 * 1024
const EVENTS = new Set(['pokemon.expansions.prices.raw_updated', 'pokemon.expansions.prices.graded_updated', 'pokemon.expansions.pop_reports.updated'])

export async function POST(request: NextRequest) {
  const secret = process.env.SCRYDEX_WEBHOOK_SECRET?.trim()
  if (!secret) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 })
  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > MAX_BODY) return NextResponse.json({ ok: false, error: 'too_large' }, { status: 413 })

  // Verify against the exact bytes Scrydex signed; never re-serialise the JSON first.
  const raw = await request.text()
  if (raw.length > MAX_BODY) return NextResponse.json({ ok: false, error: 'too_large' }, { status: 413 })
  if (!verifyScrydexSignature(raw, request.headers.get('x-scrydex-signature'), secret)) return NextResponse.json({ ok: false }, { status: 401 })

  let event: { id?: unknown; name?: unknown; data?: { expansion_ids?: unknown } }
  try { event = JSON.parse(raw) } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }) }
  const name = typeof event.name === 'string' ? event.name : ''
  if (!EVENTS.has(name)) return NextResponse.json({ ok: true, skipped: 'event_not_used' })

  const ids = (Array.isArray(event.data?.expansion_ids) ? event.data.expansion_ids : [])
    .filter((id): id is string => typeof id === 'string' && EXPANSION_ID.test(id)).slice(0, 500)
  // Expire immediately: the next visitor to an affected card gets fresh prices.
  for (const id of new Set(ids.map((value) => value.toLowerCase()))) revalidateTag(scrydexExpansionTag(id), { expire: 0 })
  return NextResponse.json({ ok: true, event: typeof event.id === 'string' ? event.id.slice(0, 80) : null, revalidated: ids.length })
}
