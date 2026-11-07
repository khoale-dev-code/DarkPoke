import Link from 'next/link'
import Form from 'next/form'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { PRODUCT_SUBNAV, SubNav } from '@/components/admin/admin-nav'
import { ProductTable } from '@/components/admin/product-table'
import { Empty, PageHeader, Pager, SearchForm, Section, Tabs } from '@/components/admin/ui'
import { ADMIN_PAGE, countProductsByType, listAdminProducts, getAdminMeta } from '@/lib/admin-data'
import { adminPage, productSort } from '@/lib/admin-query'
import { canManage, requireStaff } from '@/lib/auth'
export const metadata = { title:'Sản phẩm' }
const STATUS = { active:'Đang bán',draft:'Bản nháp',hidden:'Đang ẩn',archived:'Đã lưu trữ' }
export default async function ProductsPage({ searchParams }: { searchParams:Promise<{ type?:string; q?:string; page?:string; status?:string; low?:string; sort?:string }> }) {
  const sp=await searchParams; const page=adminPage(sp.page); const sort=productSort(sp.sort)
  const status=sp.status && Object.hasOwn(STATUS,sp.status) ? sp.status : undefined
  const [me,meta,counts,{rows,count}]=await Promise.all([requireStaff(),getAdminMeta(),countProductsByType(),listAdminProducts({type:sp.type,q:sp.q,page,status,low:sp.low === '1',sort})])
  const total=Object.values(counts).reduce((a,b) => a+b,0)
  const values={type:sp.type,q:sp.q,status,low:sp.low === '1' ? '1' : undefined,sort:sort === 'newest' ? undefined : sort}
  const link=(patch:Record<string,string|undefined>) => { const p=new URLSearchParams();for(const [k,v] of Object.entries({...values,...patch}))if(v)p.set(k,v);return `/admin/san-pham${p.size ? '?'+p : ''}` }
  const canEdit=canManage(me)
  return <><PageHeader title="Sản phẩm" subtitle={`${new Intl.NumberFormat('vi-VN').format(total)} sản phẩm trong cửa hàng · ${meta.types.length} loại sản phẩm`} actions={canEdit ? <Link href="/admin/san-pham/moi" className="btn btn-primary"><Plus size={17} aria-hidden="true" />Thêm sản phẩm</Link> : undefined} /><SubNav items={PRODUCT_SUBNAV} />
    <Tabs items={[{href:link({type:undefined,low:undefined}),label:'Tất cả',count:total,on:!sp.type && !sp.low},...meta.types.map((t) => ({href:link({type:t.code,low:undefined}),label:t.name,count:counts[t.id] ?? 0,on:sp.type === t.code && !sp.low})),{href:link({low:'1',type:undefined}),label:'Sắp hết hàng',on:sp.low === '1'}]} />
    <div className="admin-filterbar"><SearchForm key={sp.q} placeholder="Tìm tên sản phẩm, mã SKU…" defaultValue={sp.q} hidden={Object.fromEntries(Object.entries(values).filter((e):e is [string,string] => e[0] !== 'q' && !!e[1]))} /><Form action="" className="flex flex-wrap items-center gap-2">{Object.entries(values).filter(([k,v]) => !['status','sort'].includes(k) && v).map(([k,v]) => <input key={k} name={k} type="hidden" value={v} />)}<SlidersHorizontal size={16} className="text-muted" aria-hidden="true" /><label className="sr-only" htmlFor="status">Trạng thái sản phẩm</label><select name="status" id="status" defaultValue={status ?? ''} className="input"><option value="">Mọi trạng thái</option>{Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select><label className="sr-only" htmlFor="sort">Sắp xếp sản phẩm</label><select name="sort" id="sort" defaultValue={sort} className="input"><option value="newest">Mới nhất</option><option value="name-asc">Tên A → Z</option><option value="price-desc">Giá cao → thấp</option><option value="price-asc">Giá thấp → cao</option><option value="stock-asc">Tồn kho ít nhất</option></select><button type="submit" className="btn btn-secondary">Lọc</button></Form>{sp.q || status || sp.low || sp.type ? <Link href="/admin/san-pham" className="btn btn-ghost btn-sm">Xóa bộ lọc</Link> : null}</div>
    <Section title="Danh sách sản phẩm" action={<span className="text-xs text-muted">{count} kết quả · tối đa {ADMIN_PAGE} / trang</span>} bodyClass="">{rows.length ? <ProductTable key={JSON.stringify(sp)} rows={rows} types={Object.fromEntries(meta.types.map((t) => [t.id,{name:t.name,track_inventory:t.track_inventory,is_unique:t.is_unique}]))} categories={Object.fromEntries(meta.categories.map((c) => [c.id,c.name]))} canEdit={canEdit} sort={sort} /> : <Empty title="Chưa có sản phẩm phù hợp" text="Đổi từ khóa, xóa bộ lọc hoặc thêm sản phẩm mới." action={<Link href="/admin/san-pham" className="btn btn-secondary mt-2">Xem tất cả sản phẩm</Link>} />}<Pager page={page} pages={Math.ceil(count/ADMIN_PAGE)} count={count} href={(p) => link({page:String(p)})} /></Section>
  </>
}
