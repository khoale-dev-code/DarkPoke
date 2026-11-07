'use client'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { ActionButton } from '@/components/admin/action-button'
import { deleteTaxonomy, saveCategory, saveSimple } from '@/lib/actions/admin'
import { slugify } from '@/lib/utils'
import type { Category } from '@/lib/types'

type Draft = { id?: string; name: string; slug: string; parent_id: string | null; sort: number; visible: boolean }

export function CategoryManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [edit, setEdit] = useState<Draft | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const empty: Draft = { name: '', slug: '', parent_id: null, sort: 0, visible: true }
  const [d, setD] = useState<Draft>(empty)

  const tree = useMemo(() => {
    const out: (Category & { level: number })[] = []
    const walk = (p: string | null, level: number) => categories.filter((c) => c.parent_id === p).sort((a, b) => a.sort - b.sort).forEach((c) => { out.push({ ...c, level }); walk(c.id, level + 1) })
    walk(null, 0)
    return out
  }, [categories])

  const save = (draft: Draft, after: () => void) =>
    start(async () => {
      const r = await saveCategory({ ...draft, slug: draft.slug || slugify(draft.name) })
      setMsg(r.ok ? { ok: true, text: 'Đã lưu.' } : { ok: false, text: r.error })
      if (r.ok) { after(); router.refresh() }
    })

  return (
    <>
      <section className="card overflow-hidden">
        <ul className="divide-y divide-line">
          {tree.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5" style={{ paddingLeft: `${16 + c.level * 14}px` }}>
              {edit?.id === c.id ? (
                <form className="flex flex-1 flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); save(edit, () => setEdit(null)) }}>
                  <input className="input min-h-10 flex-[1_1_200px]" value={edit.name} aria-label="Tên danh mục" onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                  <input className="input min-h-10 w-20" inputMode="numeric" value={edit.sort} aria-label="Thứ tự" onChange={(e) => setEdit({ ...edit, sort: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
                  <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="switch" checked={edit.visible} onChange={(e) => setEdit({ ...edit, visible: e.target.checked })} />Hiển thị</label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEdit(null)}>Hủy</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>Lưu</button>
                </form>
              ) : (
                <>
                  <span className={`min-w-[120px] flex-1 break-words ${c.level === 0 ? 'font-bold' : ''}`}>{c.name} <span className="code text-xs text-muted">/{c.slug}</span></span>
                  {!c.visible ? <span className="pill pill-neu">Ẩn</span> : null}
                  <span className="w-20 text-right text-sm text-muted tabular-nums">{counts[c.id] ?? 0} SP</span>
                  <span className="flex">
                    {c.level < 2 ? <button type="button" className="btn btn-ghost btn-icon" aria-label={`Thêm danh mục con của ${c.name}`} onClick={() => setD({ ...empty, parent_id: c.id })}><Plus size={18} aria-hidden="true" /></button> : null}
                    <button type="button" className="btn btn-ghost btn-icon" aria-label={`Sửa ${c.name}`} onClick={() => setEdit({ id: c.id, name: c.name, slug: c.slug, parent_id: c.parent_id, sort: c.sort, visible: c.visible })}><Pencil size={18} aria-hidden="true" /></button>
                    <ActionButton action={deleteTaxonomy.bind(null, 'categories', c.id)} className="btn btn-ghost btn-icon text-bad" ariaLabel={`Xóa ${c.name}`}
                      confirm={{ title: `Xóa danh mục "${c.name}"?`, text: 'Sản phẩm trong danh mục sẽ chuyển thành chưa phân loại. Danh mục còn danh mục con thì chưa xóa được.', confirmLabel: 'Xóa danh mục', danger: true }}>
                      <Trash2 size={18} aria-hidden="true" />
                    </ActionButton>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card flex flex-col gap-4 p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold">Thêm danh mục</h2>
        <form className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); save(d, () => setD(empty)) }}>
          <label className="flex flex-col gap-1.5"><span className="label">Tên danh mục *</span><input className="input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value, slug: slugify(e.target.value) })} /></label>
          <label className="flex flex-col gap-1.5"><span className="label">Danh mục cha</span>
            <select className="input" value={d.parent_id ?? ''} onChange={(e) => setD({ ...d, parent_id: e.target.value || null })}>
              <option value="">Cấp cao nhất</option>
              {tree.filter((c) => c.level < 2).map((c) => <option key={c.id} value={c.id}>{'— '.repeat(c.level)}{c.name}</option>)}
            </select></label>
          <label className="flex flex-col gap-1.5"><span className="label">Đường dẫn</span><input className="input font-mono text-sm" value={d.slug} onChange={(e) => setD({ ...d, slug: slugify(e.target.value) })} /></label>
          <button type="submit" className="btn btn-primary" disabled={pending || !d.name.trim()}>{pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}Thêm</button>
        </form>
        <p className="hint">Danh mục lồng tối đa 3 cấp. Mỗi sản phẩm có 1 danh mục chính, dùng cho menu và đường dẫn.</p>
        {msg ? <p role="status" className={`text-sm ${msg.ok ? 'text-ok' : 'text-bad'}`}>{msg.text}</p> : null}
      </section>
    </>
  )
}

export function SimpleManager({ table, rows, noun, hint }: { table: 'collections' | 'brands'; rows: { id: string; name: string; slug: string }[]; noun: string; hint: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [d, setD] = useState({ name: '', slug: '' })
  const [edit, setEdit] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const save = (v: { id?: string; name: string; slug: string }, after: () => void) =>
    start(async () => {
      const r = await saveSimple(table, { ...v, slug: v.slug || slugify(v.name) })
      setMsg(r.ok ? { ok: true, text: 'Đã lưu.' } : { ok: false, text: r.error })
      if (r.ok) { after(); router.refresh() }
    })
  return (
    <>
      <section className="card overflow-hidden">
        {rows.length === 0 ? <p className="p-6 text-center text-muted">Chưa có {noun} nào.</p> : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                {edit?.id === r.id ? (
                  <form className="flex flex-1 flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); save(edit, () => setEdit(null)) }}>
                    <input className="input min-h-10 flex-[1_1_200px]" value={edit.name} aria-label="Tên" onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                    <input className="input min-h-10 flex-[1_1_160px] font-mono text-sm" value={edit.slug} aria-label="Đường dẫn" onChange={(e) => setEdit({ ...edit, slug: slugify(e.target.value) })} />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEdit(null)}>Hủy</button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>Lưu</button>
                  </form>
                ) : (
                  <>
                    <span className="min-w-[120px] flex-1 break-words font-semibold">{r.name} <span className="code text-xs font-normal text-muted">/{r.slug}</span></span>
                    <button type="button" className="btn btn-ghost btn-icon" aria-label={`Sửa ${r.name}`} onClick={() => setEdit(r)}><Pencil size={18} aria-hidden="true" /></button>
                    <ActionButton action={deleteTaxonomy.bind(null, table, r.id)} className="btn btn-ghost btn-icon text-bad" ariaLabel={`Xóa ${r.name}`}
                      confirm={{ title: `Xóa ${noun} "${r.name}"?`, text: 'Sản phẩm không bị xóa, chỉ bỏ liên kết.', confirmLabel: 'Xóa', danger: true }}>
                      <Trash2 size={18} aria-hidden="true" />
                    </ActionButton>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card flex flex-col gap-4 p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold">Thêm {noun}</h2>
        <form className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); save(d, () => setD({ name: '', slug: '' })) }}>
          <label className="flex flex-col gap-1.5"><span className="label">Tên *</span><input className="input" value={d.name} onChange={(e) => setD({ name: e.target.value, slug: slugify(e.target.value) })} /></label>
          <label className="flex flex-col gap-1.5"><span className="label">Đường dẫn</span><input className="input font-mono text-sm" value={d.slug} onChange={(e) => setD({ ...d, slug: slugify(e.target.value) })} /></label>
          <button type="submit" className="btn btn-primary" disabled={pending || !d.name.trim()}><Plus size={18} aria-hidden="true" />Thêm</button>
        </form>
        <p className="hint">{hint}</p>
        {msg ? <p role="status" className={`text-sm ${msg.ok ? 'text-ok' : 'text-bad'}`}>{msg.text}</p> : null}
      </section>
    </>
  )
}
