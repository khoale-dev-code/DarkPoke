import Link from 'next/link'
import { memo } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cardHref, cardImageCandidates, type LibraryCard, type LibraryQuery } from '../domain'
import { LibraryImage } from './card-image'

/** V14.25: memoized, so loading the next batch only renders the new tiles instead of every tile already on the page. */
export const LibraryTile = memo(function LibraryTile({ card, query, setName, serie, priority }: { card: LibraryCard; query: LibraryQuery; setName?: string; serie?: string | null; priority?: boolean }) {
  const candidates = cardImageCandidates({ primary: card.image, localId: card.localId, setId: card.setId, lang: query.lang, serie, quality: 'low' })
  return <Link prefetch={false} href={cardHref(card.id, query)} className="dex-tile" aria-label={`${card.name}, mã ${card.id}`}>
    <div className="dex-tile-art"><LibraryImage candidates={candidates} name={card.name} meta={`${setName || card.setId} · #${card.localId}`} priority={priority}/></div>
    <div className="dex-tile-body"><small>{setName || card.setId || 'Pokémon TCG'}</small><h3>{card.name}</h3><span className="dex-tile-id"><span>{card.id}</span><ArrowUpRight size={15} aria-hidden="true"/></span></div>
  </Link>
})

export function LibraryTileSkeleton() {
  return <div className="dex-tile dex-skeleton" aria-hidden="true"><span className="dex-skeleton-art skeleton"/><div className="dex-tile-body"><span className="skeleton h-3 w-2/3"/><span className="skeleton mt-1 h-4 w-4/5"/><span className="skeleton mt-2 h-3 w-1/2"/></div></div>
}

export function LibraryGridSkeleton() {
  return <div className="dex-grid" aria-label="Đang tải danh sách thẻ">{Array.from({ length: 12 }, (_, i) => <LibraryTileSkeleton key={`dex-skeleton:${i}`}/>)}</div>
}
