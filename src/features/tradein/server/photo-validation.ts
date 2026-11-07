import { MAX_PHOTO_BYTES } from '../domain'
export function imageMime(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((n,i) => bytes[i] === n)) return 'image/png'
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP') return 'image/webp'
  return null
}
/** Bound the stream before parsing multipart, including chunked requests. */
export async function boundedFormData(request: Request) {
  const max = MAX_PHOTO_BYTES + 64 * 1024
  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > max) throw new Error('PHOTO_TOO_LARGE')
  const reader = request.body?.getReader()
  if (!reader) throw new Error('EMPTY_BODY')
  const chunks: Uint8Array[] = []; let total = 0
  try {
    for (;;) { const {done,value} = await reader.read(); if (done) break; total += value.byteLength; if (total > max) { await reader.cancel(); throw new Error('PHOTO_TOO_LARGE') }; chunks.push(value) }
  } finally { reader.releaseLock() }
  return new Response(Buffer.concat(chunks), { headers: { 'content-type': request.headers.get('content-type') ?? '' } }).formData()
}
