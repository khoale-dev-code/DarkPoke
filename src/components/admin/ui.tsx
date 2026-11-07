import Form from 'next/form'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, PackageSearch, Search } from 'lucide-react'
import { SearchSubmit } from '@/components/admin/search-submit'
export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return <header className="admin-page-header">{back ? <Link href={back.href} className="flex min-h-9 items-center gap-1 self-start text-xs font-medium text-muted"><ChevronLeft size={15} aria-hidden="true" />{back.label}</Link> : null}<div className="admin-page-heading"><div><h1>{title}</h1>{subtitle ? <div className="admin-page-subtitle">{subtitle}</div> : null}</div>{actions ? <div className="admin-header-actions">{actions}</div> : null}</div></header>
}
export function Section({ title, action, children, className, bodyClass = 'admin-section-body', id }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; bodyClass?: string; id?: string }) {
  return <section id={id} className={`card overflow-hidden ${className ?? ''}`}>{title ? <div className="admin-section-head"><h2>{title}</h2>{action}</div> : null}<div className={bodyClass}>{children}</div></section>
}
export function Pill({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'neu' | 'brand'; children: React.ReactNode }) { return <span className={`pill pill-${tone}`}><span className="pill-dot" aria-hidden="true" />{children}</span> }
export function Tabs({ items }: { items: { href: string; label: string; count?: number; on: boolean }[] }) {
  return <nav className="admin-tabs" aria-label="Lọc danh sách">{items.map((t) => <Link key={t.href} href={t.href} aria-current={t.on ? 'page' : undefined}>{t.label}{t.count !== undefined ? <span className="tab-count">{new Intl.NumberFormat('vi-VN').format(t.count)}</span> : null}</Link>)}</nav>
}
export function Pager({ page, pages, href, count, pageSize = 20 }: { page: number; pages: number; href: (p: number) => string; count?: number; pageSize?: number }) {
  const n = Math.max(1,pages)
  const slots = [...new Set([1,page-1,page,page+1,n])].filter((p) => p > 0 && p <= n).sort((a,b) => a-b)
  return <nav className="admin-pager" aria-label="Phân trang"><span>{count === undefined ? `Trang ${page} / ${n}` : count === 0 ? '0 kết quả' : `${Math.min((page-1)*pageSize+1,count)}–${Math.min(page*pageSize,count)} / ${new Intl.NumberFormat('vi-VN').format(count)} kết quả`}</span>{n > 1 ? <div className="admin-pager-pages">{page > 1 ? <Link href={href(page-1)} aria-label="Trang trước"><ChevronLeft size={17} aria-hidden="true" /></Link> : null}{slots.map((p,i) => <span key={p} className="!p-0">{i > 0 && p > slots[i-1]! + 1 ? <span aria-hidden="true">…</span> : null}<Link href={href(p)} aria-current={p === page ? 'page' : undefined} aria-label={`Trang ${p}`}>{p}</Link></span>)}{page < n ? <Link href={href(page+1)} aria-label="Trang sau"><ChevronRight size={17} aria-hidden="true" /></Link> : null}</div> : null}</nav>
}
export function Empty({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) { return <div className="admin-empty"><span className="admin-empty-icon"><PackageSearch size={26} strokeWidth={1.5} aria-hidden="true" /></span><p className="font-semibold">{title}</p>{text ? <p className="max-w-md text-sm text-muted">{text}</p> : null}{action}</div> }
export function SearchForm({ placeholder, defaultValue, hidden }: { placeholder: string; defaultValue?: string; hidden?: Record<string,string> }) {
  return <Form action="" className="admin-search" role="search">{Object.entries(hidden ?? {}).filter(([,v]) => v).map(([k,v]) => <input key={k} type="hidden" name={k} value={v} />)}<label className="admin-search-box"><Search size={18} className="shrink-0 text-muted" aria-hidden="true" /><input name="q" type="search" defaultValue={defaultValue} placeholder={placeholder} aria-label={placeholder} /></label><SearchSubmit /></Form>
}
