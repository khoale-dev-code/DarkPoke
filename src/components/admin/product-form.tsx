'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema } from '@/lib/schemas/product'
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react'
import { ActionButton } from '@/components/admin/action-button'
import { ProductImage } from '@/components/shop/product-image'
import { deleteProduct, saveProduct, type ProductInput } from '@/lib/actions/admin'
import { createClient } from '@/lib/supabase/browser'
import { slugify } from '@/lib/utils'
import type { CatalogMeta } from '@/lib/catalog'
import type { ProductDetail, ProductStatus } from '@/lib/types'

type VariantRow = { id?: string; sku: string; title: string; option_values: string[]; price: string; stock: string; active: boolean }
type Opt = { name: string; values: string[]; draft: string }

const num = (s: string) => (s.trim() === '' ? null : Number(s.replace(/\D/g, '')))
const str = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n))

function cartesian(opts: { values: string[] }[]): string[][] {
  return opts.reduce<string[][]>((acc, o) => acc.flatMap((a) => o.values.map((v) => [...a, v])).slice(0,101), [[]])
}

export function ProductForm({ meta, product, defaultTypeCode, canUpload, readOnly = false }: { meta: CatalogMeta; product: ProductDetail | null; defaultTypeCode?: string; canUpload: boolean; readOnly?: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const initialType = product?.type_id ?? meta.types.find((t) => t.code === defaultTypeCode)?.id ?? meta.types[0]?.id ?? ''
  const [typeId, setTypeId] = useState(initialType)
  const type = meta.types.find((t) => t.id === typeId)
  const attrDefs = meta.attributes.filter((a) => a.type_id === typeId).sort((a, b) => a.sort - b.sort)

  const [f, setF] = useState({
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    sku: product?.sku ?? '',
    description: product?.description ?? '',
    unit: product?.unit ?? 'Cái',
    brand_id: product?.brand_id ?? '',
    category_id: product?.category_id ?? '',
    price: str(product?.price),
    compare_at_price: str(product?.compare_at_price),
    cost: str(product?.cost),
    stock: str(product?.variants.length === 1 ? product.variants[0]?.stock : product?.stock_total ?? 0),
    min_stock: str(product?.min_stock ?? 0),
    purchase_limit: str(product?.purchase_limit),
    weight_g: str(product?.weight_g),
    status: (product?.status ?? 'active') as ProductStatus,
    online: product?.online ?? true,
    pos: product?.pos ?? true,
    is_featured: product?.is_featured ?? false,
    tags: (product?.tags ?? []).join(', '),
    allow_preorder: product?.allow_preorder ?? false,
    preorder_deposit_pct: str(product?.preorder_deposit_pct),
    preorder_release_date: product?.preorder_release_date ?? '',
    preorder_slots: str(product?.preorder_slots),
    preorder_closes_at: product?.preorder_closes_at?.slice(0, 10) ?? '',
    seo_title: product?.seo_title ?? '',
    seo_description: product?.seo_description ?? ''
  })
  const [slugTouched, setSlugTouched] = useState(!!product)
  const [attrs, setAttrs] = useState<Record<string, string | number | boolean>>(product?.attrs ?? {})
  const [images, setImages] = useState(product?.images.map((i) => ({ url: i.url, alt: i.alt })) ?? [])
  const [imgUrl, setImgUrl] = useState('')
  const [collections, setCollections] = useState<string[]>(product?.collection_ids ?? [])

  const startVariants = (product?.options.length ?? 0) > 0
  const [useVariants, setUseVariants] = useState(startVariants)
  const [options, setOptions] = useState<Opt[]>(product?.options.map((o) => ({ name: o.name, values: o.values, draft: '' })) ?? [{ name: 'Màu sắc', values: [], draft: '' }])
  const [variantData, setVariantData] = useState<Record<string, VariantRow>>(() =>
    Object.fromEntries((product?.variants ?? []).filter((v) => v.option_values.length).map((v) => [v.option_values.join(' / '), { id: v.id, sku: v.sku, title: v.title, option_values: v.option_values, price: str(v.price), stock: String(v.stock), active: v.active }]))
  )
  const defaultVariantId = product?.variants.find((v) => !v.option_values.length)?.id

  const variants: VariantRow[] = useMemo(() => {
    if (!useVariants) return []
    const filled = options.filter((o) => o.name.trim() && o.values.length)
    if (!filled.length) return []
    return cartesian(filled).map((combo, i) => {
      const key = combo.join(' / ')
      return variantData[key] ?? { sku: `${f.sku || 'SKU'}-${i + 1}`, title: key, option_values: combo, price: '', stock: '0', active: true }
    })
  }, [useVariants, options, variantData, f.sku])

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))
  const setVariant = (key: string, patch: Partial<VariantRow>) => {
    const cur = variants.find((v) => v.option_values.join(' / ') === key)
    if (cur) setVariantData((d) => ({ ...d, [key]: { ...cur, ...patch } }))
  }

  const cats = useMemo(() => {
    const out: { id: string; label: string }[] = []
    const walk = (parent: string | null, prefix: string) =>
      meta.categories.filter((c) => c.parent_id === parent).sort((a, b) => a.sort - b.sort).forEach((c) => {
        out.push({ id: c.id, label: prefix + c.name })
        walk(c.id, `${prefix}${c.name} › `)
      })
    walk(null, '')
    return out
  }, [meta.categories])

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    const sb = createClient()
    for (const file of Array.from(files).slice(0, 10)) {
      if (file.size > 5 * 1024 * 1024) { setError('Ảnh tối đa 5MB.'); continue }
      const path = `${crypto.randomUUID()}.${(file.name.split('.').pop() ?? 'jpg').toLowerCase()}`
      const { error: e } = await sb.storage.from('products').upload(path, file, { cacheControl: '31536000', contentType: file.type })
      if (e) { setError('Tải ảnh chưa được: tài khoản cần quyền quản lý.'); continue }
      const { data } = sb.storage.from('products').getPublicUrl(path)
      setImages((s) => [...s, { url: data.publicUrl, alt: f.name }])
    }
    setUploading(false)
  }

  const payload: ProductInput = {
    id: product?.id,
    type_id: typeId,
    category_id: f.category_id,
    brand_id: f.brand_id,
    name: f.name,
    slug: f.slug || slugify(f.name),
    sku: f.sku,
    description: f.description,
    unit: f.unit,
    price: num(f.price) ?? 0,
    compare_at_price: num(f.compare_at_price),
    cost: num(f.cost),
    stock: num(f.stock) ?? 0,
    status: f.status,
    online: f.online,
    pos: f.pos,
    is_featured: f.is_featured,
    attrs: Object.fromEntries(Object.entries(attrs).filter(([k, v]) => v !== '' && attrDefs.some((a) => a.code === k))),
    tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
    images,
    options: useVariants ? options.filter((o) => o.name.trim() && o.values.length).map((o) => ({ name: o.name.trim(), values: o.values })) : [],
    variants: useVariants
      ? variants.map((v) => ({ id: v.id, sku: v.sku.trim(), title: v.title, option_values: v.option_values, price: num(v.price), stock: num(v.stock) ?? 0, active: v.active }))
      : [{ id: defaultVariantId, sku: f.sku.trim(), title: 'Mặc định', option_values: [], price: null, stock: num(f.stock) ?? 0, active: true }],
    collection_ids: collections,
    min_stock: num(f.min_stock) ?? 0,
    purchase_limit: num(f.purchase_limit),
    weight_g: num(f.weight_g),
    allow_preorder: !!type?.allow_preorder && f.allow_preorder,
    preorder_deposit_pct: num(f.preorder_deposit_pct),
    preorder_release_date: f.preorder_release_date || null,
    preorder_slots: num(f.preorder_slots),
    preorder_closes_at: f.preorder_closes_at ? `${f.preorder_closes_at}T23:59:59+07:00` : null,
    seo_title: f.seo_title,
    seo_description: f.seo_description
  }
  const { handleSubmit, formState: { errors } } = useForm<ProductInput>({ values: payload, resolver: zodResolver(productSchema) })
  function submit(e: React.FormEvent<HTMLFormElement>) {
    setError(null); setSaved(null)
    void handleSubmit((validated) => start(async () => {
      try {
        const r = await saveProduct(validated)
        if (!r.ok) { setError(r.error); return }
        setSaved('Đã lưu sản phẩm.')
        if (!product && r.data?.id) router.replace(`/admin/san-pham/${r.data.id}`)
        else router.refresh()
      } catch { setError('Chưa kết nối được máy chủ. Dữ liệu đang nhập vẫn được giữ để bạn thử lại.') }
    }), (issues) => {
      const first = Object.values(issues).find((v) => typeof v?.message === 'string')
      setError(String(first?.message ?? 'Kiểm tra các trường bắt buộc và số lượng biến thể (tối đa 100).'))
      document.getElementById('product-validation')?.scrollIntoView({ block:'center', behavior:'auto' })
    })(e)
  }

  const inputCls = 'input !pr-10'
  return (
    <form onSubmit={submit} className="flex flex-col gap-5 pb-24" noValidate>
      {readOnly ? <p className="admin-notice">Bạn đang xem sản phẩm. Chủ shop và quản lý có thể chỉnh sửa.</p> : null}
      <nav className="admin-form-index" aria-label="Đi đến phần nhập sản phẩm">{['Loại sản phẩm','Thông tin chung','Hình ảnh','Giá và kho','Phân loại','Hiển thị và bán'].map((label) => <a key={label} href={`#product-${slugify(label)}`}>{label}</a>)}</nav>
      <div id="product-validation" role="alert" aria-live="polite">{error ? <p className="rounded-xl bg-bad-bg p-4 text-sm text-bad">{error}</p> : null}</div>
      <fieldset disabled={readOnly || pending} className="contents">
      <Card title="Loại sản phẩm">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <Field label="Loại sản phẩm *" hint="Loại quyết định các thuộc tính và cách bán bên dưới.">
            <select className={inputCls} value={typeId} onChange={(e) => { setTypeId(e.target.value); setUseVariants(false) }}>
              {meta.types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <div className="flex flex-wrap items-center gap-2 pb-7">
            {type?.has_variants ? <span className="pill pill-brand">Có biến thể</span> : null}
            {type?.is_unique ? <span className="pill pill-brand">Món duy nhất</span> : type?.track_inventory ? <span className="pill pill-brand">Theo dõi tồn kho</span> : null}
            {type?.allow_preorder ? <span className="pill pill-brand">Cho pre-order</span> : <span className="pill pill-neu">Không pre-order</span>}
            {type ? <Link href={`/admin/loai-san-pham/${type.id}`} className="btn btn-ghost btn-sm">Sửa loại này</Link> : null}
          </div>
        </div>
      </Card>

      <Card title="Thông tin chung">
        <Field label="Tên sản phẩm *">
          <input {...{name: 'name'}} aria-invalid={!!errors.name} className={inputCls} value={f.name} required onChange={(e) => { set('name', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)) }} />
        </Field>
        {errors.name ? <p className="text-xs text-bad">{errors.name.message}</p> : null}
        <Grid>
          <Field label="SKU *" hint={useVariants ? 'SKU biến thể nối thêm hậu tố' : 'Mã quét ở quầy'}><input className={`${inputCls} font-mono`} value={f.sku} onChange={(e) => set('sku', e.target.value.toUpperCase())} /></Field>
          <Field label="Thương hiệu">
            <select className={inputCls} value={f.brand_id} onChange={(e) => set('brand_id', e.target.value)}>
              <option value="">Không có</option>
              {meta.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Đơn vị tính"><input className={inputCls} value={f.unit} onChange={(e) => set('unit', e.target.value)} /></Field>
        </Grid>
        <Field label="Mô tả"><textarea className={inputCls} rows={4} value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
      </Card>

      <Card title="Hình ảnh">
        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {images.map((im, i) => (
            <div key={`${im.url}-${i}`} className="relative overflow-hidden rounded-xl border border-line">
              <ProductImage src={im.url} alt={im.alt} sizes="160px" />
              {i === 0 ? <span className="pill pill-brand absolute top-1.5 left-1.5">Ảnh chính</span> : null}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-0.5 bg-white/85 p-1">
                <button type="button" className="btn btn-ghost btn-icon min-h-8 w-8" aria-label="Đưa lên trước" disabled={i === 0} onClick={() => setImages((s) => { const n = [...s]; [n[i - 1], n[i]] = [n[i]!, n[i - 1]!]; return n })}><ArrowUp size={14} aria-hidden="true" /></button>
                <button type="button" className="btn btn-ghost btn-icon min-h-8 w-8" aria-label="Đưa xuống sau" disabled={i === images.length - 1} onClick={() => setImages((s) => { const n = [...s]; [n[i + 1], n[i]] = [n[i]!, n[i + 1]!]; return n })}><ArrowDown size={14} aria-hidden="true" /></button>
                <button type="button" className="btn btn-ghost btn-icon min-h-8 w-8 text-bad" aria-label="Xóa ảnh" onClick={() => setImages((s) => s.filter((_, j) => j !== i))}><X size={14} aria-hidden="true" /></button>
              </div>
            </div>
          ))}
          <button type="button" disabled={!canUpload || uploading} onClick={() => fileRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ctl text-sm text-muted hover:bg-surface disabled:opacity-50">
            {uploading ? <Loader2 size={22} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={22} aria-hidden="true" />}
            {uploading ? 'Đang tải' : 'Tải ảnh'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
        <div className="flex gap-2">
          <input className={inputCls} value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="Hoặc dán đường dẫn ảnh (https://… hoặc /art/box1.svg)" aria-label="Đường dẫn ảnh" />
          <button type="button" className="btn btn-secondary" onClick={() => { if (imgUrl.trim()) { setImages((s) => [...s, { url: imgUrl.trim(), alt: f.name }]); setImgUrl('') } }}>Thêm</button>
        </div>
        <p className="hint">Ảnh vuông, tối thiểu 1000×1000 px, tối đa 5MB. Ảnh đầu tiên là ảnh chính.{canUpload ? '' : ' Tải ảnh lên cần cấu hình Supabase.'}</p>
      </Card>

      <Card title="Giá và kho">
        <Grid>
          <Field label="Giá bán *" suffix="₫"><input className={inputCls} inputMode="numeric" value={f.price} onChange={(e) => set('price', e.target.value.replace(/\D/g, ''))} /></Field>
          <Field label="Giá gốc (gạch ngang)" suffix="₫"><input className={inputCls} inputMode="numeric" value={f.compare_at_price} placeholder="Để trống nếu không giảm" onChange={(e) => set('compare_at_price', e.target.value.replace(/\D/g, ''))} /></Field>
          <Field label="Giá vốn" hint="Chỉ nội bộ" suffix="₫"><input className={inputCls} inputMode="numeric" value={f.cost} onChange={(e) => set('cost', e.target.value.replace(/\D/g, ''))} /></Field>
          {!useVariants ? (
            <Field label={type?.is_unique ? 'Tồn kho (món duy nhất: 0 hoặc 1)' : 'Tồn kho'}><input className={inputCls} inputMode="numeric" value={f.stock} onChange={(e) => set('stock', e.target.value.replace(/\D/g, ''))} /></Field>
          ) : null}
          <Field label="Tồn tối thiểu" hint="Cảnh báo khi dưới mức này"><input className={inputCls} inputMode="numeric" value={f.min_stock} onChange={(e) => set('min_stock', e.target.value.replace(/\D/g, ''))} /></Field>
          <Field label="Giới hạn mua mỗi đơn"><input className={inputCls} inputMode="numeric" value={f.purchase_limit} placeholder="Không giới hạn" onChange={(e) => set('purchase_limit', e.target.value.replace(/\D/g, ''))} /></Field>
        </Grid>
      </Card>

      {type?.has_variants ? (
        <Card title="Biến thể" action={variants.length ? <span className="pill pill-brand">{variants.length} biến thể</span> : null}>
          <label className="flex items-center justify-between gap-4">
            <span className="flex flex-col"><span className="label">Sản phẩm có nhiều lựa chọn</span><span className="hint">Ví dụ màu sắc, kích cỡ. Mỗi biến thể có SKU, giá, tồn kho riêng.</span></span>
            <input type="checkbox" className="switch" checked={useVariants} onChange={(e) => setUseVariants(e.target.checked)} />
          </label>
          {useVariants ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {options.map((o, i) => (
                  <div key={i} className="flex flex-col gap-2 rounded-xl border border-line p-3">
                    <div className="flex gap-2">
                      <input className={inputCls} value={o.name} aria-label={`Tên tùy chọn ${i + 1}`} placeholder="Tên tùy chọn, ví dụ Kích cỡ" onChange={(e) => setOptions((s) => s.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                      <button type="button" className="btn btn-ghost btn-icon text-bad" aria-label="Xóa tùy chọn" onClick={() => setOptions((s) => s.filter((_, j) => j !== i))}><Trash2 size={18} aria-hidden="true" /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {o.values.map((v) => (
                        <span key={v} className="chip">{v}<button type="button" aria-label={`Xóa ${v}`} onClick={() => setOptions((s) => s.map((x, j) => (j === i ? { ...x, values: x.values.filter((y) => y !== v) } : x)))}><X size={14} aria-hidden="true" /></button></span>
                      ))}
                    </div>
                    <input
                      className={inputCls}
                      value={o.draft}
                      placeholder="Gõ giá trị rồi nhấn Enter"
                      aria-label={`Thêm giá trị cho ${o.name || 'tùy chọn'}`}
                      onChange={(e) => setOptions((s) => s.map((x, j) => (j === i ? { ...x, draft: e.target.value } : x)))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault()
                          const v = o.draft.trim()
                          if (v && !o.values.includes(v)) setOptions((s) => s.map((x, j) => (j === i ? { ...x, values: [...x.values, v], draft: '' } : x)))
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
              {options.length < 3 ? <button type="button" className="btn btn-secondary self-start" onClick={() => setOptions((s) => [...s, { name: '', values: [], draft: '' }])}><Plus size={18} aria-hidden="true" />Thêm tùy chọn</button> : null}
              {variants.length > 100 ? <p role="alert" className="rounded-xl bg-warn-bg p-3 text-sm text-warn">Tối đa 100 biến thể. Giảm số giá trị tùy chọn trước khi lưu.</p> : null}
              {variants.length ? (
                <div className="table-wrap rounded-xl border border-line">
                  <table className="tbl">
                    <thead><tr><th>Biến thể</th><th>SKU</th><th className="num">Giá (trống = giá mặc định)</th><th className="num">Tồn</th><th>Bán</th></tr></thead>
                    <tbody>
                      {variants.map((v) => {
                        const key = v.option_values.join(' / ')
                        return (
                          <tr key={key}>
                            <td className="font-semibold whitespace-nowrap">{key}</td>
                            <td><input className="input min-h-9 min-w-40 font-mono text-sm" value={v.sku} aria-label={`SKU ${key}`} onChange={(e) => setVariant(key, { sku: e.target.value.toUpperCase() })} /></td>
                            <td className="num"><input className="input min-h-9 w-32 text-right" inputMode="numeric" value={v.price} placeholder={f.price} aria-label={`Giá ${key}`} onChange={(e) => setVariant(key, { price: e.target.value.replace(/\D/g, '') })} /></td>
                            <td className="num"><input className="input min-h-9 w-20 text-right" inputMode="numeric" value={v.stock} aria-label={`Tồn ${key}`} onChange={(e) => setVariant(key, { stock: e.target.value.replace(/\D/g, '') })} /></td>
                            <td><input type="checkbox" className="switch" checked={v.active} aria-label={`Bán ${key}`} onChange={(e) => setVariant(key, { active: e.target.checked })} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <p className="hint">Thêm giá trị cho tùy chọn để tạo bảng biến thể.</p>}
            </>
          ) : null}
        </Card>
      ) : null}

      {attrDefs.length ? (
        <Card title={`Thuộc tính loại ${type?.name ?? ''}`}>
          <p className="hint">Các trường do loại sản phẩm quy định. Muốn thêm, bớt trường thì sửa ở Loại sản phẩm.</p>
          <Grid>
            {attrDefs.map((a) => {
              const val = attrs[a.code]
              const label = `${a.name}${a.required ? ' *' : ''}`
              const hint = a.filterable ? 'Hiện ở bộ lọc cửa hàng' : undefined
              if (a.kind === 'select') return (
                <Field key={a.id} label={label} hint={hint}>
                  <select className={inputCls} value={String(val ?? '')} onChange={(e) => setAttrs((s) => ({ ...s, [a.code]: e.target.value }))}>
                    <option value="">Chọn</option>
                    {a.options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
              )
              if (a.kind === 'boolean') return (
                <label key={a.id} className="flex min-h-11 items-center justify-between gap-3 self-end"><span className="label">{label}</span>
                  <input type="checkbox" className="switch" checked={val === true} onChange={(e) => setAttrs((s) => ({ ...s, [a.code]: e.target.checked }))} /></label>
              )
              return (
                <Field key={a.id} label={label} hint={hint}>
                  <input className={inputCls} type={a.kind === 'date' ? 'date' : 'text'} inputMode={a.kind === 'number' ? 'numeric' : undefined} value={String(val ?? '')}
                    onChange={(e) => setAttrs((s) => ({ ...s, [a.code]: a.kind === 'number' ? (e.target.value === '' ? '' : Number(e.target.value.replace(/[^\d.]/g, ''))) : e.target.value }))} />
                </Field>
              )
            })}
          </Grid>
        </Card>
      ) : null}

      <Card title="Phân loại">
        <Grid>
          <Field label="Danh mục chính" hint="Dùng cho menu và đường dẫn">
            <select className={inputCls} value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">Chưa chọn</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Thẻ (tag)" hint="Cách nhau bằng dấu phẩy"><input className={inputCls} value={f.tags} onChange={(e) => set('tags', e.target.value)} /></Field>
        </Grid>
        {meta.collections.length ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="label mb-1">Bộ sưu tập</legend>
            <div className="flex flex-wrap gap-2">
              {meta.collections.map((c) => (
                <button key={c.id} type="button" className="chip" aria-pressed={collections.includes(c.id)} onClick={() => setCollections((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))}>{c.name}</button>
              ))}
            </div>
          </fieldset>
        ) : null}
      </Card>

      <Card title="Hiển thị và bán">
        <Grid>
          <Field label="Trạng thái">
            <select className={inputCls} value={f.status} onChange={(e) => set('status', e.target.value as ProductStatus)}>
              <option value="active">Đang bán</option><option value="draft">Nháp</option><option value="hidden">Ẩn</option><option value="archived">Lưu trữ</option>
            </select>
          </Field>
          <Field label="Đường dẫn (slug)"><input className={`${inputCls} font-mono text-sm`} value={f.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)) }} /></Field>
        </Grid>
        <Toggle label="Hiển thị trên cửa hàng online" hint="Tắt để ẩn, sản phẩm vẫn giữ trong kho." checked={f.online} onChange={(v) => set('online', v)} />
        <Toggle label="Bán tại quầy (POS)" hint="Cho phép thu ngân tìm và bán sản phẩm này." checked={f.pos} onChange={(v) => set('pos', v)} />
        <Toggle label="Nổi bật ở trang chủ" checked={f.is_featured} onChange={(v) => set('is_featured', v)} />
        {type?.allow_preorder ? (
          <>
            <Toggle label="Cho đặt trước (pre-order có đặt cọc)" hint="Khách đặt cọc giữ suất, không trừ tồn kho." checked={f.allow_preorder} onChange={(v) => set('allow_preorder', v)} />
            {f.allow_preorder ? (
              <Grid>
                <Field label="Tỷ lệ cọc" hint="Trống = theo Cài đặt" suffix="%"><input className={inputCls} inputMode="numeric" value={f.preorder_deposit_pct} onChange={(e) => set('preorder_deposit_pct', e.target.value.replace(/\D/g, ''))} /></Field>
                <Field label="Tổng số suất" hint="Hết suất thì tự khóa đặt"><input className={inputCls} inputMode="numeric" value={f.preorder_slots} onChange={(e) => set('preorder_slots', e.target.value.replace(/\D/g, ''))} /></Field>
                <Field label="Ngày hàng về dự kiến"><input className={inputCls} type="date" value={f.preorder_release_date} onChange={(e) => set('preorder_release_date', e.target.value)} /></Field>
                <Field label="Đóng đặt vào"><input className={inputCls} type="date" value={f.preorder_closes_at} onChange={(e) => set('preorder_closes_at', e.target.value)} /></Field>
              </Grid>
            ) : null}
          </>
        ) : null}
        <Grid>
          <Field label="Tiêu đề SEO"><input className={inputCls} value={f.seo_title} placeholder={f.name} onChange={(e) => set('seo_title', e.target.value)} /></Field>
          <Field label="Mô tả SEO"><input className={inputCls} value={f.seo_description} onChange={(e) => set('seo_description', e.target.value)} /></Field>
        </Grid>
      </Card>

      </fieldset>
      {!readOnly ? <div className="admin-savebar">
        <div className="admin-savebar-inner">
          {product ? (
            <ActionButton
              action={deleteProduct.bind(null, product.id)}
              className="btn btn-danger-outline"
              confirm={{ title: `Xóa "${product.name}"?`, text: 'Sản phẩm, biến thể và ảnh sẽ bị xóa. Đơn hàng cũ vẫn giữ tên và giá đã bán. Nên dùng Lưu trữ nếu chỉ muốn ngừng bán.', confirmLabel: 'Xóa sản phẩm', danger: true }}
              onDone={() => router.push('/admin/san-pham')}
            >
              <Trash2 size={16} aria-hidden="true" />Xóa
            </ActionButton>
          ) : null}
          <span role="status" className="min-w-0 flex-1 text-sm">{error ? <span className="text-bad">{error}</span> : saved ? <span className="text-ok">{saved}</span> : null}</span>
          <Link href="/admin/san-pham" className="btn btn-ghost">Hủy</Link>
          <button type="submit" className="btn btn-primary" disabled={pending || uploading || variants.length > 100}>{pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}Lưu sản phẩm</button>
        </div>
      </div> : null}
    </form>
  )
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={`product-${slugify(title)}`} className="card admin-form-section overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5"><h2 className="font-display text-lg font-bold">{title}</h2>{action}</div>
      <div className="flex flex-col gap-4 p-4 sm:p-5">{children}</div>
    </section>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid items-start gap-5 sm:grid-cols-2">{children}</div>
}

function Field({ label, hint, suffix, children }: { label: string; hint?: string; suffix?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label min-h-5">{label}</span>
      {suffix ? <span className="relative flex items-center">{children}<span className="pointer-events-none absolute right-3 text-sm text-muted">{suffix}</span></span> : children}
      {hint ? <span className="hint">{hint}</span> : null}
    </label>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <span className="flex flex-col"><span className="label">{label}</span>{hint ? <span className="hint">{hint}</span> : null}</span>
      <input type="checkbox" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}
