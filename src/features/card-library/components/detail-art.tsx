'use client'
import { useState } from 'react'
import { Expand } from 'lucide-react'
import { ShopDialog } from '@/components/shop/dialog'
import type { ImageCandidate } from '../domain'
import { LibraryImage } from './card-image'

export function DetailArt({ candidates, zoomCandidates, name, meta }: { candidates: ImageCandidate[]; zoomCandidates: ImageCandidate[]; name: string; meta?: string }) {
  const [open, setOpen] = useState(false)
  const hasImage = candidates.length > 0
  return <div className="dex-detail-art">
    <button type="button" className="dex-zoom-button" disabled={!hasImage} aria-label={`Xem ảnh lớn của ${name}`} onClick={() => setOpen(true)}>
      <LibraryImage candidates={candidates} name={name} meta={meta} large priority />
      {hasImage ? <span><Expand size={16} aria-hidden="true" />Xem ảnh lớn</span> : null}
    </button>
    <ShopDialog open={open} onClose={() => setOpen(false)} title={name} wide><div className="dex-zoom"><LibraryImage candidates={zoomCandidates} name={name} meta={meta} large /></div></ShopDialog>
  </div>
}
