'use client'
import { useId, useRef, useState } from 'react'
import { Camera, Expand, ImagePlus, X } from 'lucide-react'
import { ShopDialog } from '@/components/shop/dialog'
import { MAX_PHOTOS } from '../domain'
import type { LocalPhoto } from '../hooks/use-tradein-photos'
interface Props { photos: LocalPhoto[]; total: number; itemName: string; disabled: boolean; onAdd: (files: FileList | File[]) => void; onRemove: (id: string) => void }

/** Photos for one item: a drop zone with shooting tips, then thumbnails that open larger. */
export function PhotoPicker({ photos, total, itemName, disabled, onAdd, onRemove }: Props) {
  const input = useRef<HTMLInputElement>(null); const id = useId(); const [selected, setSelected] = useState<LocalPhoto | null>(null)
  const [dragging, setDragging] = useState(false)
  const full = total >= MAX_PHOTOS; const label = itemName || 'vật phẩm'
  return <div className="tx-field tx-photos">
    <div className="tx-photo-head"><span className="tx-label">Ảnh thực tế <small>Không bắt buộc</small></span><span className="tx-hint">{total}/{MAX_PHOTOS} ảnh cho cả yêu cầu</span></div>
    <input ref={input} id={id} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled || full} aria-label={`Chọn ảnh cho ${label}`} onChange={(e) => { if (e.target.files) onAdd(e.target.files); e.target.value = '' }} />
    <div className={`tx-drop${dragging ? ' is-dragging' : ''}`} onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); if (!disabled) onAdd(e.dataTransfer.files) }}>
      {photos.length ? <div className="tx-photo-grid">
        {photos.map((p, index) => <div className="tx-photo" key={p.id}>
          <button type="button" className="tx-photo-open" aria-label={`Xem ảnh ${index + 1} của ${label}`} onClick={() => setSelected(p)}><img src={p.url} alt={`Ảnh thực tế ${index + 1} của ${label}`} width={180} height={180} loading="lazy" decoding="async" /><span><Expand size={14} aria-hidden="true" /></span></button>
          <button type="button" className="tx-photo-remove" disabled={disabled} onClick={() => onRemove(p.id)} aria-label={`Xóa ảnh ${index + 1} của ${label}`}><X size={16} aria-hidden="true" /></button>
        </div>)}
        <button type="button" className="tx-photo-more" disabled={disabled || full} onClick={() => input.current?.click()}><ImagePlus size={22} aria-hidden="true" /><span>Thêm ảnh</span></button>
      </div> : <div className="tx-photo-empty">
        <span className="tx-photo-icon"><Camera size={24} strokeWidth={1.6} aria-hidden="true" /></span>
        <div><b>Kéo ảnh vào đây hoặc chọn từ máy</b><p>Nên chụp mặt trước, mặt sau và các góc có vết xước.</p></div>
        <button type="button" className="btn btn-secondary" disabled={disabled || full} onClick={() => input.current?.click()}><ImagePlus size={17} aria-hidden="true" />Chọn ảnh</button>
      </div>}
    </div>
    <small className="tx-hint">JPG, PNG hoặc WebP, mỗi ảnh tối đa 2 MB.</small>
    <ShopDialog open={!!selected} onClose={() => setSelected(null)} title="Ảnh vật phẩm đã chọn" wide><div className="tx-preview">{selected ? <img src={selected.url} alt={`Ảnh thực tế của ${label}`} width={800} height={800} /> : null}</div><p className="tx-caption">{selected?.file.name}</p></ShopDialog>
  </div>
}
