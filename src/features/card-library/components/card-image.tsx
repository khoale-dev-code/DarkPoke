'use client'
import Image from 'next/image'
import { useState } from 'react'
import type { ImageCandidate } from '../domain'
import '../card-image.css'

interface Props { candidates: ImageCandidate[]; name: string; meta?: string; large?: boolean; priority?: boolean }

/**
 * Tries each image source in turn (TCGdex → English print → Pokémon TCG API). When none loads, a card-shaped
 * placeholder with the name, set and number keeps the grid tidy instead of an empty "image missing" box.
 */
export function LibraryImage({ candidates, name, meta, large = false, priority = false }: Props) {
  const chain = candidates.map((candidate) => candidate.src).join('|')
  const [state, setState] = useState({ chain, index: 0 })
  const index = state.chain === chain ? state.index : 0
  const current = candidates[index]
  return <span className={`dex-image ${large ? 'dex-image-large' : ''}`}>
    {current
      ? <>
        <Image key={current.src} unoptimized src={current.src} alt={name} fill priority={priority && index === 0} className="object-contain"
          sizes={large ? '(max-width: 767px) 88vw, 430px' : '(max-width: 600px) 44vw, (max-width: 900px) 28vw, 220px'}
          onError={() => setState({ chain, index: index + 1 })} />
        {current.note ? <span className="dex-image-note">{current.note}</span> : null}
      </>
      : <span className="dex-ph" role="img" aria-label={`${name}: chưa có ảnh thẻ`}>
        <span className="dex-ph-name">{name}</span>
        <span className="dex-ph-ball" aria-hidden="true" />
        {meta ? <span className="dex-ph-meta">{meta}</span> : null}
        <span className="dex-ph-tag">Chưa có ảnh</span>
      </span>}
  </span>
}
