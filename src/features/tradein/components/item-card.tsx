'use client'
import { useId, useRef, type ChangeEvent } from 'react'
import { useController, useFormContext, useWatch } from 'react-hook-form'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { CONDITIONS, type TradeinInput } from '../domain'
import { PhotoPicker } from './photo-picker'
import { amountInWords, digitsOnly, groupThousands } from '../money'
import type { LocalPhoto } from '../hooks/use-tradein-photos'

interface Props { index: number; canRemove: boolean; photos: LocalPhoto[]; total: number; disabled: boolean; onRemove: () => void; onAddPhotos: (files: FileList | File[]) => void; onRemovePhoto: (id: string) => void }

/** One item: name, condition as tappable cards, quantity stepper, expected price and photos. */
export function ItemCard({ index, canRemove, photos, total, disabled, onRemove, onAddPhotos, onRemovePhoto }: Props) {
  const id = useId(); const { register, control, setValue, formState: { errors } } = useFormContext<TradeinInput>()
  const item = useWatch({ control, name: `items.${index}` }); const error = errors.items?.[index]
  const qty = Number.isFinite(item?.qty) ? Number(item.qty) : 1
  const step = (delta: number) => setValue(`items.${index}.qty`, Math.min(999, Math.max(1, qty + delta)), { shouldValidate: true, shouldDirty: true })
  const title = `Vật phẩm ${index + 1}`

  return <article className="tx-item" aria-label={title}>
    <div className="tx-item-head">
      <span className="tx-item-tag">{title}</span>
      <span className="tx-item-name">{item?.name?.trim() || 'Chưa có tên'}</span>
      {canRemove ? <button type="button" className="tx-item-remove" disabled={disabled} onClick={onRemove} aria-label={`Xóa ${title.toLowerCase()}`}><Trash2 size={16} aria-hidden="true" /><span>Xóa</span></button> : null}
    </div>
    <div className="tx-item-body">
      <label className="tx-field" htmlFor={`${id}-name`}>
        <span className="tx-label">Tên thẻ hoặc vật phẩm <em>*</em></span>
        <input id={`${id}-name`} className="tx-input" placeholder="Ví dụ: Charizard ex · Obsidian Flames #125" autoComplete="off" maxLength={200} aria-invalid={!!error?.name} aria-describedby={error?.name ? `${id}-name-error` : `${id}-name-hint`} {...register(`items.${index}.name`)} />
        {error?.name ? <small className="tx-error" id={`${id}-name-error`}>{error.name.message}</small> : <small className="tx-hint" id={`${id}-name-hint`}>Ghi cả tên bộ, số thẻ và ngôn ngữ nếu có.</small>}
      </label>

      <fieldset className="tx-field tx-conditions">
        <legend className="tx-label">Tình trạng hiện tại <em>*</em></legend>
        <div className="tx-choice-grid">
          {CONDITIONS.map((c) => <label key={c.value} className="tx-choice">
            <input type="radio" value={c.value} {...register(`items.${index}.condition`)} />
            <span><b>{c.label}</b><small>{c.detail}</small></span>
          </label>)}
        </div>
      </fieldset>

      {item?.condition === 'OTHER' ? <label className="tx-field" htmlFor={`${id}-note`}>
        <span className="tx-label">Mô tả tình trạng <em>*</em></span>
        <textarea id={`${id}-note`} className="tx-input" rows={3} maxLength={500} placeholder="Ví dụ: thẻ hơi cong, góc phải có vết xước nhỏ, chưa sửa chữa…" aria-invalid={!!error?.condition_note} aria-describedby={`${id}-note-hint`} {...register(`items.${index}.condition_note`)} />
        <small id={`${id}-note-hint`} className={error?.condition_note ? 'tx-error' : 'tx-hint'}>{error?.condition_note?.message ?? `${item.condition_note?.length ?? 0}/500 ký tự`}</small>
      </label> : null}

      <div className="tx-row">
        <div className="tx-field">
          <label className="tx-label" htmlFor={`${id}-qty`}>Số lượng <em>*</em></label>
          <div className="tx-stepper">
            <button type="button" onClick={() => step(-1)} disabled={disabled || qty <= 1} aria-label="Giảm số lượng"><Minus size={18} aria-hidden="true" /></button>
            <input id={`${id}-qty`} type="number" inputMode="numeric" min={1} max={999} step={1} aria-invalid={!!error?.qty} aria-describedby={error?.qty ? `${id}-qty-error` : undefined} {...register(`items.${index}.qty`, { valueAsNumber: true })} />
            <button type="button" onClick={() => step(1)} disabled={disabled || qty >= 999} aria-label="Tăng số lượng"><Plus size={18} aria-hidden="true" /></button>
          </div>
          {error?.qty ? <small className="tx-error" id={`${id}-qty-error`}>{error.qty.message}</small> : null}
        </div>
        <PriceField id={`${id}-expected`} index={index} />
      </div>

      <PhotoPicker photos={photos} total={total} itemName={item?.name ?? ''} disabled={disabled} onAdd={onAddPhotos} onRemove={onRemovePhoto} />
    </div>
  </article>
}

/** Expected price: stored as plain digits, shown as 1.000.000 while typing, with the amount in words underneath. */
function PriceField({ id, index }: { id: string; index: number }) {
  const { control } = useFormContext<TradeinInput>()
  const { field, fieldState } = useController({ control, name: `items.${index}.expected` })
  const input = useRef<HTMLInputElement | null>(null)
  const digits = digitsOnly(String(field.value ?? ''))
  const words = amountInWords(digits)
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const el = event.target; const caret = el.selectionStart ?? el.value.length
    const before = digitsOnly(el.value.slice(0, caret)).length
    const next = digitsOnly(el.value); field.onChange(next)
    // Put the caret back after the same number of digits once the dots are re-inserted.
    requestAnimationFrame(() => {
      const node = input.current; if (!node || document.activeElement !== node) return
      const shown = groupThousands(next); let pos = 0; let seen = 0
      while (pos < shown.length && seen < before) { if (/\d/.test(shown.charAt(pos))) seen++; pos++ }
      node.setSelectionRange(pos, pos)
    })
  }
  return <div className="tx-field">
    <label className="tx-label" htmlFor={id}>Giá mong muốn <small>Không bắt buộc</small></label>
    <span className="tx-money">
      <input id={id} className="tx-input" inputMode="numeric" autoComplete="off" placeholder="Ví dụ: 450.000" maxLength={15}
        ref={(node) => { input.current = node; field.ref(node) }} name={field.name} value={groupThousands(digits)} onChange={onChange} onBlur={field.onBlur}
        aria-invalid={!!fieldState.error} aria-describedby={`${id}-words`} />
      <b aria-hidden="true">₫</b>
    </span>
    <small id={`${id}-words`} className={fieldState.error ? 'tx-error' : 'tx-hint tx-words'} aria-live="polite">{fieldState.error?.message ?? (words || 'Số tiền bằng chữ sẽ hiện ở đây.')}</small>
  </div>
}
