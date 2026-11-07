import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/** Scrydex signs "<t>.<raw body>" with HMAC-SHA256; deliveries older than five minutes are rejected. */
const TOLERANCE_SECONDS = 300

function parseSignature(header: string | null) {
  if (!header || header.length > 600) return null
  let t = ''; const v1: string[] = []
  for (const part of header.split(',')) {
    const [key, value] = part.trim().split('=', 2)
    if (key === 't' && value) t = value
    if (key === 'v1' && value && /^[a-f0-9]{64}$/i.test(value)) v1.push(value.toLowerCase())
  }
  return /^\d{9,13}$/.test(t) && v1.length ? { t, v1 } : null
}

export function verifyScrydexSignature(rawBody: string, header: string | null, secret: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  const signature = parseSignature(header)
  if (!signature) return false
  // Scrydex documents seconds; a millisecond timestamp is tolerated for the age check only.
  const issued = signature.t.length >= 13 ? Math.floor(Number(signature.t) / 1000) : Number(signature.t)
  if (Math.abs(nowSeconds - issued) > TOLERANCE_SECONDS) return false
  const expected = createHmac('sha256', secret).update(`${signature.t}.${rawBody}`, 'utf8').digest()
  return signature.v1.some((candidate) => {
    const given = Buffer.from(candidate, 'hex')
    return given.length === expected.length && timingSafeEqual(given, expected)
  })
}
