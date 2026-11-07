import { CARD_ID, PAGE_SIZE, SET_ID, libraryParams, type LibraryCard, type LibraryPage, type LibraryQuery } from './domain'

/** Page numbers are an internal API cursor; they never become pagination controls. */
export function nextLibraryBatch(last: LibraryPage): number | undefined {
  return last.hasNext && last.items.length > 0 && last.page < 5000 ? last.page + 1 : undefined
}

export function mergeLibraryCards(pages: LibraryPage[]): LibraryCard[] {
  return [...new Map(pages.flatMap(page => page.items).map(card => [card.id, card])).values()]
}

function isCard(value: unknown): value is LibraryCard {
  if (!value || typeof value !== 'object') return false
  const card = value as Partial<LibraryCard>
  return typeof card.id === 'string' && CARD_ID.test(card.id)
    && typeof card.name === 'string' && !!card.name
    && typeof card.localId === 'string'
    && typeof card.setId === 'string' && (!card.setId || SET_ID.test(card.setId))
    && (card.image === null || typeof card.image === 'string')
}

export async function fetchLibraryBatch(query: LibraryQuery, page: number, signal?: AbortSignal): Promise<LibraryPage> {
  const params = libraryParams({ ...query, page })
  const response = await fetch(`/api/card-library?${params}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('TCGDEX_BATCH_UNAVAILABLE')
  const value: unknown = await response.json()
  if (!value || typeof value !== 'object') throw new Error('TCGDEX_BATCH_INVALID')
  const batch = value as Partial<LibraryPage>
  if (batch.page !== page || typeof batch.hasNext !== 'boolean' || !Array.isArray(batch.items)
    || batch.items.length > PAGE_SIZE || !batch.items.every(isCard)) throw new Error('TCGDEX_BATCH_INVALID')
  return { items: batch.items, page, hasNext: batch.hasNext }
}
