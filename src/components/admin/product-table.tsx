'use client'
import Link from 'next/link'
import { useMemo, useOptimistic, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ArrowDownUp, Download, Eye, EyeOff, Loader2, MoreHorizontal, Pencil, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ProductImage } from '@/components/shop/product-image'
import { Pill } from '@/components/admin/ui'
import { bulkProductStatus } from '@/lib/actions/admin'
import { csvCell, type ProductSort } from '@/lib/admin-query'
import { priceRange } from '@/lib/utils'
import type { AdminProductRow } from '@/lib/admin-data'
import type { ProductStatus } from '@/lib/types'
export const PRODUCT_STATUS = { active: ['Đang bán','ok'], draft: ['Bản nháp','neu'], hidden: ['Đang ẩn','warn'], archived: ['Đã lưu trữ','neu'] } as const
interface Props { rows: AdminProductRow[]; types: Record<string,{ name:string; track_inventory:boolean; is_unique:boolean }>; categories: Record<string,string>; canEdit:boolean; sort:ProductSort }
export function ProductTable({ rows, types, categories, canEdit, sort }: Props) {
  const router = useRouter(); const pathname = usePathname(); const params = useSearchParams()
  const [selection, setSelection] = useState<Record<string,boolean>>({})
  const [pending,start] = useTransition()
  const [message,setMessage] = useState<{ error:boolean; text:string } | null>(null)
  const [optimistic,updateOptimistic] = useOptimistic(rows,(current, patch:{ ids:string[]; status:ProductStatus }) => current.map((p) => patch.ids.includes(p.id) ? { ...p,status:patch.status } : p))
  const selected = optimistic.filter((p) => selection[p.id])
  const changeStatus = (ids:string[],status:'active'|'hidden') => start(async () => {
    setMessage(null); updateOptimistic({ ids,status })
    try { const r = await bulkProductStatus(ids,status); if (!r.ok) { setMessage({error:true,text:r.error}); return }; setSelection({}); setMessage({error:false,text:'Đã cập nhật sản phẩm.'}); router.refresh() }
    catch { setMessage({error:true,text:'Chưa kết nối được máy chủ. Trạng thái đã được khôi phục.'}) }
  })
  const sortBy = (value:ProductSort) => { const p = new URLSearchParams(params); p.set('sort',value); p.delete('page'); start(() => router.push(`${pathname}?${p}`)) }
  const actions = (p:AdminProductRow) => <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="btn btn-ghost btn-icon" disabled={pending} aria-label={`Thao tác với ${p.name}`}><MoreHorizontal size={19} aria-hidden="true" /></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/admin/san-pham/${p.id}`}><Pencil size={16} aria-hidden="true" />{canEdit ? 'Chỉnh sửa sản phẩm' : 'Xem sản phẩm'}</Link></DropdownMenuItem>{canEdit && p.status !== 'archived' ? <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => changeStatus([p.id],p.status === 'active' ? 'hidden' : 'active')}>{p.status === 'active' ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}{p.status === 'active' ? 'Ẩn khỏi cửa hàng' : 'Mở bán sản phẩm'}</DropdownMenuItem></> : null}</DropdownMenuContent></DropdownMenu>
  const stock = (p:AdminProductRow) => {
    const t = types[p.type_id]
    const low = p.status === 'active' && !p.allow_preorder && t?.track_inventory && !t.is_unique && p.stock_total <= p.min_stock
    return <span className={low ? 'font-semibold text-bad' : 'text-muted'}>{p.allow_preorder ? `${p.preorder_slots ?? '∞'} suất đặt trước` : `${p.stock_total} có sẵn`}{p.variant_count > 1 ? <small className="block text-[11px] font-normal text-muted">{p.variant_count} biến thể</small> : null}</span>
  }
  // Sorting is manual: headers change the URL, Postgres sorts the complete result set.
  const columns: ColumnDef<AdminProductRow>[] = useMemo(() => [
    ...(canEdit ? [{ id:'select', header:({ table }) => <Checkbox aria-label="Chọn tất cả sản phẩm trên trang này" checked={table.getIsAllRowsSelected() ? true : table.getIsSomeRowsSelected() ? 'indeterminate' : false} onCheckedChange={(v) => table.toggleAllRowsSelected(!!v)} />, cell:({row}) => <Checkbox aria-label={`Chọn ${row.original.name}`} checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} /> } satisfies ColumnDef<AdminProductRow>] : []),
    { id:'name', accessorKey:'name', header:() => <button className="sort-button" onClick={() => sortBy(sort === 'name-asc' ? 'newest' : 'name-asc')}>Sản phẩm<ArrowDownUp size={13} aria-hidden="true" /></button>, cell:({row}) => <Link href={`/admin/san-pham/${row.original.id}`} className="flex max-w-[360px] items-center gap-3"><span className="w-12 shrink-0 overflow-hidden rounded-lg border border-line"><ProductImage src={row.original.thumbnail} alt="" sizes="48px" /></span><span className="flex flex-col gap-1"><b className="line-clamp-2 font-semibold">{row.original.name}</b><span className="font-mono text-[11px] text-muted">{row.original.sku}</span></span></Link> },
    { id:'type',header:'Phân loại',cell:({row}) => <span className="flex flex-col gap-1"><span>{types[row.original.type_id]?.name ?? '—'}</span><span className="text-[11px] text-muted">{categories[row.original.category_id ?? ''] ?? 'Chưa có danh mục'}</span></span> },
    { id:'price',accessorKey:'min_price',header:() => <button className="sort-button" onClick={() => sortBy(sort === 'price-desc' ? 'price-asc' : 'price-desc')}>Giá bán<ArrowDownUp size={13} aria-hidden="true" /></button>,cell:({row}) => <span className="font-semibold whitespace-nowrap tabular-nums">{priceRange(row.original)}</span> },
    { id:'stock',accessorKey:'stock_total',header:() => <button className="sort-button" onClick={() => sortBy('stock-asc')}>Tồn kho<ArrowDownUp size={13} aria-hidden="true" /></button>,cell:({row}) => stock(row.original) },
    { id:'status',header:'Trạng thái',cell:({row}) => <Pill tone={PRODUCT_STATUS[row.original.status][1]}>{PRODUCT_STATUS[row.original.status][0]}</Pill> },
    { id:'actions',header:() => <span className="sr-only">Thao tác</span>,cell:({row}) => actions(row.original) }
  // Callbacks read the current rows and query; 20 rows per page keeps this bounded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ],[canEdit,types,categories,sort,pending,params,pathname])
  const table = useReactTable({ data:optimistic,columns,getCoreRowModel:getCoreRowModel(),getRowId:(r) => r.id,manualSorting:true,enableRowSelection:canEdit,state:{rowSelection:selection},onRowSelectionChange:setSelection })
  function download() {
    const csv = [['SKU','Sản phẩm','Giá bán','Tồn kho','Trạng thái'],...selected.map((p) => [p.sku,p.name,p.min_price ?? p.price,p.stock_total,PRODUCT_STATUS[p.status][0]])].map((r) => r.map(csvCell).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'})); const a = document.createElement('a'); a.href=url;a.download='dark-poke-san-pham-da-chon.csv';a.click();setTimeout(() => URL.revokeObjectURL(url),1000)
  }
  return <div aria-busy={pending} className={pending ? 'opacity-70' : ''}>
    {message ? <p role={message.error ? 'alert' : 'status'} className={`px-5 py-3 text-sm ${message.error ? 'bg-bad-bg text-bad' : 'bg-ok-bg text-ok'}`}>{message.text}</p> : null}
    {selected.length ? <div className="admin-bulkbar"><b>Đã chọn {selected.length} / {rows.length}</b><span className="text-muted">trên trang này</span><div className="ml-auto flex flex-wrap gap-1"><button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => changeStatus(selected.map((p) => p.id),'active')}><Eye size={15} aria-hidden="true" />Mở bán</button><button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => changeStatus(selected.map((p) => p.id),'hidden')}><EyeOff size={15} aria-hidden="true" />Ẩn</button><button type="button" className="btn btn-ghost btn-sm" onClick={download}><Download size={15} aria-hidden="true" />Xuất CSV</button><button type="button" className="btn btn-ghost btn-icon" onClick={() => setSelection({})} aria-label="Bỏ chọn"><X size={17} aria-hidden="true" /></button></div></div> : null}
    <div className="admin-desktop-only table-wrap"><table className="tbl"><caption className="sr-only">Sản phẩm trên trang hiện tại, lọc và sắp xếp ở server</caption><thead>{table.getHeaderGroups().map((g) => <tr key={g.id}>{g.headers.map((h) => <th key={h.id} className={h.id === 'select' ? '!w-12 !px-1' : undefined} aria-sort={h.id === 'name' && sort === 'name-asc' ? 'ascending' : h.id === 'price' && sort.startsWith('price-') ? sort === 'price-asc' ? 'ascending' : 'descending' : h.id === 'stock' && sort === 'stock-asc' ? 'ascending' : undefined}>{flexRender(h.column.columnDef.header,h.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((r) => <tr key={r.id} data-selected={r.getIsSelected()}>{r.getVisibleCells().map((c) => <td key={c.id} className={c.column.id === 'select' ? '!px-1' : undefined}>{flexRender(c.column.columnDef.cell,c.getContext())}</td>)}</tr>)}</tbody></table></div>
    <div className="admin-mobile-only">{canEdit ? <label className="flex items-center gap-1 border-b border-line px-3 text-xs text-muted"><Checkbox aria-label="Chọn tất cả trên trang" checked={table.getIsAllRowsSelected() ? true : table.getIsSomeRowsSelected() ? 'indeterminate' : false} onCheckedChange={(v) => table.toggleAllRowsSelected(!!v)} />Chọn sản phẩm trên trang</label> : null}{table.getRowModel().rows.map((r) => { const p=r.original;return <div key={p.id} className="admin-mobile-record" style={!canEdit ? {gridTemplateColumns:'56px minmax(0,1fr) auto'} : undefined}>{canEdit ? <Checkbox aria-label={`Chọn ${p.name}`} checked={r.getIsSelected()} onCheckedChange={(v) => r.toggleSelected(!!v)} /> : null}<Link href={`/admin/san-pham/${p.id}`} className="overflow-hidden rounded-lg border border-line"><ProductImage src={p.thumbnail} alt="" sizes="56px" /></Link><div><Link href={`/admin/san-pham/${p.id}`} className="line-clamp-2 text-xs font-semibold">{p.name}</Link><p className="mt-1 font-mono text-[10px] text-muted">{p.sku}</p><p className="mt-1 text-sm font-semibold tabular-nums">{priceRange(p)}</p><div className="record-meta">{stock(p)}<Pill tone={PRODUCT_STATUS[p.status][1]}>{PRODUCT_STATUS[p.status][0]}</Pill></div></div>{actions(p)}</div> })}</div>
    {pending ? <span role="status" className="sr-only"><Loader2 />Đang cập nhật</span> : null}
  </div>
}
