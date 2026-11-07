'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react'
import { ActionButton } from '@/components/admin/action-button'
import { deleteProductType, saveProductType, type ProductTypeInput } from '@/lib/actions/admin'
import { slugify } from '@/lib/utils'
import type { AttrKind } from '@/lib/types'

export type TypeDraft = Omit<ProductTypeInput, 'attributes'> & { attributes: (Omit<ProductTypeInput['attributes'][number], 'kind'> & { kind: AttrKind })[] }

const KIND: Record<AttrKind, string> = { text: 'Văn bản', number: 'Số', select: 'Danh sách chọn', boolean: 'Có hoặc không', date: 'Ngày' }
const BEHAVIORS: { k: keyof Omit<TypeDraft, 'attributes' | 'id' | 'code' | 'name' | 'description'>; t: string; d: string }[] = [
  { k: 'track_inventory', t: 'Theo dõi tồn kho', d: 'Trừ tồn khi bán, cảnh báo khi sắp hết.' },
  { k: 'is_unique', t: 'Mỗi sản phẩm là một món duy nhất', d: 'Tồn tối đa 1. Dùng cho thẻ lẻ, hàng sưu tầm.' },
  { k: 'has_variants', t: 'Có biến thể', d: 'Cho phép tùy chọn như màu, kích cỡ với SKU và tồn riêng.' },
  { k: 'allow_preorder', t: 'Cho phép pre-order có đặt cọc', d: 'Cần bật mô-đun Pre-order ở Cài đặt.' },
  { k: 'allow_tradein', t: 'Cho phép thu mua và trade-in', d: 'Khách có thể gửi yêu cầu bán loại hàng này cho shop.' },
  { k: 'hold_in_cart', t: 'Giữ hàng trong giỏ', d: 'Tránh hai khách cùng mua một món duy nhất (theo phút cài ở Cài đặt).' }
]

export function TypeForm({ draft, inUse }: { draft: TypeDraft; inUse: number }) {
  const router = useRouter()
  const [t, setT] = useState(draft)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [optDraft, setOptDraft] = useState<Record<number, string>>({})

  const setAttr = (i: number, patch: Partial<TypeDraft['attributes'][number]>) => setT((s) => ({ ...s, attributes: s.attributes.map((a, j) => (j === i ? { ...a, ...patch } : a)) }))
  const move = (i: number, d: -1 | 1) => setT((s) => { const n = [...s.attributes]; const j = i + d; if (j < 0 || j >= n.length) return s; [n[i], n[j]] = [n[j]!, n[i]!]; return { ...s, attributes: n } })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    start(async () => {
      const r = await saveProductType(t as ProductTypeInput)
      if (!r.ok) { setMsg({ ok: false, text: r.error }); return }
      setMsg({ ok: true, text: 'Đã lưu loại sản phẩm.' })
      if (!t.id && r.data?.id) router.replace(`/admin/loai-san-pham/${r.data.id}`)
      else router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 pb-24">
      <section className="card flex flex-col gap-4 p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold">Thông tin loại</h2>
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5"><span className="label">Tên loại *</span>
            <input required className="input" value={t.name} onChange={(e) => setT((s) => ({ ...s, name: e.target.value, code: s.id ? s.code : slugify(e.target.value) }))} /></label>
          <label className="flex flex-col gap-1.5"><span className="label">Mã loại</span>
            <input className="input font-mono text-sm" value={t.code} disabled={!!t.id} onChange={(e) => setT((s) => ({ ...s, code: slugify(e.target.value) }))} />
            <span className="hint">{t.id ? 'Không đổi được sau khi tạo (dùng khi nhập Excel, đường dẫn bộ lọc).' : 'Tự tạo từ tên.'}</span></label>
        </div>
        <label className="flex flex-col gap-1.5"><span className="label">Mô tả nội bộ</span><input className="input" value={t.description} onChange={(e) => setT((s) => ({ ...s, description: e.target.value }))} /></label>
      </section>

      <section className="card flex flex-col gap-0 p-4 sm:p-5">
        <h2 className="mb-3 font-display text-lg font-bold">Cách bán</h2>
        {BEHAVIORS.map((b) => (
          <label key={b.k} className="flex items-center justify-between gap-4 border-t border-line py-3.5 first-of-type:border-t-0">
            <span className="flex flex-col"><span className="label">{b.t}</span><span className="hint">{b.d}</span></span>
            <input type="checkbox" className="switch" checked={!!t[b.k]} onChange={(e) => setT((s) => ({ ...s, [b.k]: e.target.checked }))} />
          </label>
        ))}
      </section>

      <section className="card flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Thuộc tính</h2>
          <button type="button" className="btn btn-secondary" onClick={() => setT((s) => ({ ...s, attributes: [...s.attributes, { code: '', name: '', kind: 'text', options: [], required: false, filterable: false, visible: true }] }))}><Plus size={18} aria-hidden="true" />Thêm thuộc tính</button>
        </div>
        {inUse ? (
          <p className="flex gap-2 rounded-xl bg-warn-bg p-3 text-sm text-warn"><AlertTriangle size={18} className="flex-none" aria-hidden="true" />{inUse} sản phẩm đang dùng loại này. Thêm thuộc tính bắt buộc không chặn sản phẩm cũ, nhưng khi sửa sản phẩm sẽ cần nhập đủ.</p>
        ) : null}
        {t.attributes.length === 0 ? <p className="hint">Chưa có thuộc tính. Sản phẩm loại này chỉ có tên, giá, tồn kho, ảnh.</p> : null}
        {t.attributes.map((a, i) => (
          <div key={a.id ?? `new-${i}`} className="flex flex-col gap-3 rounded-xl border border-line p-3 sm:p-4">
            <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <label className="flex flex-col gap-1.5"><span className="label">Tên thuộc tính *</span>
                <input required className="input" value={a.name} onChange={(e) => setAttr(i, { name: e.target.value, code: a.id ? a.code : slugify(e.target.value).replace(/-/g, '_') })} /></label>
              <label className="flex flex-col gap-1.5"><span className="label">Mã</span>
                <input className="input font-mono text-sm" value={a.code} disabled={!!a.id} onChange={(e) => setAttr(i, { code: slugify(e.target.value).replace(/-/g, '_') })} /></label>
              <label className="flex flex-col gap-1.5"><span className="label">Kiểu dữ liệu</span>
                <select className="input" value={a.kind} onChange={(e) => setAttr(i, { kind: e.target.value as AttrKind })}>
                  {(Object.keys(KIND) as AttrKind[]).map((k) => <option key={k} value={k}>{KIND[k]}</option>)}
                </select></label>
            </div>
            {a.kind === 'select' ? (
              <div className="flex flex-col gap-2">
                <span className="label">Giá trị</span>
                <div className="flex flex-wrap gap-2">
                  {a.options.map((o) => <span key={o} className="chip">{o}<button type="button" aria-label={`Xóa ${o}`} onClick={() => setAttr(i, { options: a.options.filter((x) => x !== o) })}>×</button></span>)}
                </div>
                <input className="input" placeholder="Gõ giá trị rồi nhấn Enter" value={optDraft[i] ?? ''} aria-label={`Thêm giá trị cho ${a.name}`}
                  onChange={(e) => setOptDraft((s) => ({ ...s, [i]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const v = (optDraft[i] ?? '').trim(); if (v && !a.options.includes(v)) setAttr(i, { options: [...a.options, v] }); setOptDraft((s) => ({ ...s, [i]: '' })) } }} />
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {([['required', 'Bắt buộc'], ['filterable', 'Lọc ở cửa hàng'], ['visible', 'Hiện ở trang sản phẩm']] as const).map(([k, l]) => (
                <label key={k} className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" className="switch" checked={a[k]} onChange={(e) => setAttr(i, { [k]: e.target.checked })} />{l}</label>
              ))}
              <span className="ml-auto flex">
                <button type="button" className="btn btn-ghost btn-icon" aria-label="Đưa lên" onClick={() => move(i, -1)}><ArrowUp size={18} aria-hidden="true" /></button>
                <button type="button" className="btn btn-ghost btn-icon" aria-label="Đưa xuống" onClick={() => move(i, 1)}><ArrowDown size={18} aria-hidden="true" /></button>
                <button type="button" className="btn btn-ghost btn-icon text-bad" aria-label={`Xóa thuộc tính ${a.name}`} onClick={() => setT((s) => ({ ...s, attributes: s.attributes.filter((_, j) => j !== i) }))}><Trash2 size={18} aria-hidden="true" /></button>
              </span>
            </div>
          </div>
        ))}
      </section>

      <div className="admin-savebar">
        <div className="admin-savebar-inner">
          {t.id ? (
            inUse ? <span className="text-sm text-muted">Không xóa được: đang có {inUse} sản phẩm</span> : (
              <ActionButton action={deleteProductType.bind(null, t.id)} className="btn btn-danger-outline" onDone={() => router.push('/admin/loai-san-pham')}
                confirm={{ title: `Xóa loại "${t.name}"?`, text: 'Thuộc tính của loại này cũng bị xóa.', confirmLabel: 'Xóa loại', danger: true }}>Xóa</ActionButton>
            )
          ) : null}
          <span role="status" className="min-w-0 flex-1 text-sm">{msg ? <span className={msg.ok ? 'text-ok' : 'text-bad'}>{msg.text}</span> : null}</span>
          <Link href="/admin/loai-san-pham" className="btn btn-ghost">Hủy</Link>
          <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}Lưu loại sản phẩm</button>
        </div>
      </div>
    </form>
  )
}
