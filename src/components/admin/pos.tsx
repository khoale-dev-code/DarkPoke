'use client'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/browser'
import { isDemo } from '@/lib/env'
import { AdminConnection } from '@/components/admin/connection'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Camera, ShoppingBag, ArrowLeft, Banknote, CreditCard, Landmark, Loader2, Minus, Plus, Printer, ScanLine, Search, Trash2 } from 'lucide-react'
import { ProductImage } from '@/components/shop/product-image'
import { posCheckout, posSearch } from '@/lib/actions/admin'
import { formatDateTime, formatVND, isPlaceholder } from '@/lib/utils'
import type { ShopSettings, StaffRole } from '@/lib/types'

const BarcodeScanner=dynamic(()=>import('@/components/admin/barcode-scanner'),{ssr:false,loading:()=> <p role="status" className="text-sm text-muted">Đang chuẩn bị camera…</p>})

type Hit = Awaited<ReturnType<typeof posSearch>>[number]
type Line = Hit & { qty: number }
type Pay = 'cash' | 'bank_transfer' | 'card'

export function PosScreen({ cashier, role, maxDiscountPct, shopName, bank }: { cashier: string; role: StaffRole; maxDiscountPct: number; shopName: string; bank: ShopSettings['bank'] }) {
  const [q, setQ] = useState('')
  const [loadedQuery,setLoadedQuery]=useState('')
  const [searchError,setSearchError]=useState<string|null>(null)
  const [scanner,setScanner]=useState(false)
  const [inventoryTick,setInventoryTick]=useState(0)
  const [online,setOnline]=useState(true)
  const [rawHits, setHits] = useState<Hit[]>([])
  const [searching, startSearch] = useTransition()
  const [lines, setLines] = useState<Line[]>([])
  const [discount, setDiscount] = useState('')
  const [pay, setPay] = useState<Pay>('cash')
  const [given, setGiven] = useState('')
  const [customer, setCustomer] = useState({ name: '', phone: '' })
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<{ code: string; lines: Line[]; total: number; discount: number; pay: Pay; at: string; change: number } | null>(null)
  const [showCart, setShowCart] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(()=>{
    const update=()=>setOnline(navigator.onLine);update();window.addEventListener('online',update);window.addEventListener('offline',update)
    if(window.matchMedia('(min-width:1024px)').matches)input.current?.focus()
    return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update)}
  },[])
  useEffect(()=>{
    if(isDemo)return
    const sb=createClient()
    const channel=sb.channel('pos-visible-stock').on('postgres_changes',{event:'UPDATE',schema:'public',table:'variants'},(payload)=>{
      const row=payload.new as {id?:string;stock?:number}
      if(row.id && typeof row.stock==='number')setLines((s)=>s.map((l)=>l.variant_id===row.id?{...l,stock:row.stock!}:l))
      setInventoryTick((n)=>n+1)
    }).subscribe()
    return()=>{void sb.removeChannel(channel)}
  },[])
  useEffect(() => {
    const term=q.trim();let cancelled=false
    if(term.length<2)return
    const timer=setTimeout(()=>startSearch(async()=>{
      try { const result=await posSearch(term);if(!cancelled){setHits(result);setLoadedQuery(term);setSearchError(null)} }
      catch {if(!cancelled)setSearchError('Chưa tìm được sản phẩm. Kiểm tra mạng rồi thử lại.')}
    }),220)
    return()=>{cancelled=true;clearTimeout(timer)}
  },[q,inventoryTick])
  const hits=q.trim().length>=2 && loadedQuery===q.trim() ? rawHits : []
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
  const disc = Math.min(Number(discount) || 0, subtotal)
  const total = subtotal - disc
  const overLimit = (role === 'cashier' || role === 'staff') && disc > (subtotal * maxDiscountPct) / 100
  const change = pay === 'cash' && given ? Number(given) - total : 0

  function add(h: Hit) {
    setLines((s) => {
      const f = s.find((l) => l.variant_id === h.variant_id)
      if (f) return s.map((l) => (l.variant_id === h.variant_id ? { ...l, qty: Math.min(l.qty + 1, Math.max(l.stock, 1)) } : l))
      return [...s, { ...h, qty: 1 }]
    })
    setQ('')
    input.current?.focus()
  }

  function checkout() {
    if(!online || !lines.length || pending || overLimit)return
    setError(null)
    start(async () => {
      try {
      const r = await posCheckout({ items: lines.map((l) => ({ variant_id: l.variant_id, qty: l.qty })), payment: pay, discount: disc, customer })
      if (!r.ok) { setError(r.error); return }
      setReceipt({ code: r.data?.code ?? '', lines, total, discount: disc, pay, at: new Date().toISOString(), change })
      setLines([]); setDiscount(''); setGiven(''); setCustomer({ name: '', phone: '' }); setShowCart(false)
      } catch {setError('Chưa nhận được xác nhận từ máy chủ. Tra đơn hàng và kiểm tra thanh toán trước khi thử lại.')}
    })
  }

  if (receipt) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 p-4 py-8">
        <div className="card flex flex-col gap-3 p-5 font-mono text-sm" id="receipt">
          <p className="text-center font-sans text-lg font-bold">{shopName}</p>
          <p className="text-center">{isDemo ? 'ĐƠN MẪU · chưa lưu dữ liệu' : 'Hóa đơn'} {receipt.code}<br />{formatDateTime(receipt.at)} · {cashier}</p>
          <hr className="border-dashed border-ctl" />
          {receipt.lines.map((l) => (
            <div key={l.variant_id} className="flex justify-between gap-3"><span>{l.name}{l.title !== 'Mặc định' ? ` (${l.title})` : ''} × {l.qty}</span><span>{formatVND(l.price * l.qty)}</span></div>
          ))}
          <hr className="border-dashed border-ctl" />
          {receipt.discount ? <div className="flex justify-between"><span>Giảm giá</span><span>-{formatVND(receipt.discount)}</span></div> : null}
          <div className="flex justify-between text-base font-bold"><span>Tổng</span><span>{formatVND(receipt.total)}</span></div>
          <div className="flex justify-between"><span>Thanh toán</span><span>{receipt.pay === 'cash' ? 'Tiền mặt' : receipt.pay === 'card' ? 'Thẻ' : 'Chuyển khoản'}</span></div>
          {receipt.change > 0 ? <div className="flex justify-between"><span>Tiền thối</span><span>{formatVND(receipt.change)}</span></div> : null}
          <p className="text-center">Cảm ơn bạn. Hunt - Trade - Collect</p>
        </div>
        <div className="no-print flex gap-2">
          <button type="button" className="btn btn-secondary flex-1" onClick={() => window.print()}><Printer size={18} aria-hidden="true" />In hóa đơn</button>
          <button type="button" className="btn btn-primary flex-1" onClick={() => setReceipt(null)}>Đơn mới</button>
        </div>
      </div>
    )
  }

  const qrUrl = pay === 'bank_transfer' && total > 0 && !isPlaceholder(bank.account_no)
    ? `https://img.vietqr.io/image/${bank.bank_bin}-${bank.account_no}-compact2.png?amount=${total}&addInfo=${encodeURIComponent('POS ' + shopName)}&accountName=${encodeURIComponent(bank.account_name)}`
    : null

  const cart = (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Đơn tại quầy</h2>{lines.length ? <button type="button" className="btn btn-ghost btn-sm text-bad" onClick={() => setLines([])}>Xóa hết</button> : null}</div>
      {lines.some(l=>l.qty>l.stock)?<p role="alert" className="rounded-xl bg-warn-bg p-3 text-xs text-warn">Tồn kho vừa thay đổi. Giảm số lượng trong đơn trước khi thanh toán.</p>:null}
      {lines.length === 0 ? <div className="flex flex-col items-center gap-3 rounded-xl bg-surface px-4 py-8 text-center"><ShoppingBag size={28} strokeWidth={1.5} className="text-muted" aria-hidden="true"/><p className="text-sm font-semibold">Đơn hàng đang trống</p><p className="text-xs text-muted">Quét mã hoặc tìm sản phẩm để bắt đầu.</p></div> : (
        <ul className="flex flex-col divide-y divide-line">
          {lines.map((l) => (
            <li key={l.variant_id} className="flex items-center gap-2 py-2">
              <span className="flex min-w-0 flex-1 flex-col"><b className="line-clamp-1 text-sm">{l.name}</b><span className="text-xs text-muted">{l.title !== 'Mặc định' ? `${l.title} · ` : ''}{formatVND(l.price)}</span></span>
              <button type="button" className="btn btn-ghost btn-icon min-h-10 w-10" aria-label="Giảm" onClick={() => setLines((s) => s.map((x) => (x.variant_id === l.variant_id ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))}><Minus size={16} aria-hidden="true" /></button>
              <span className="w-6 text-center font-bold tabular-nums">{l.qty}</span>
              <button type="button" className="btn btn-ghost btn-icon min-h-10 w-10" aria-label="Tăng" disabled={l.qty >= l.stock} onClick={() => setLines((s) => s.map((x) => (x.variant_id === l.variant_id ? { ...x, qty: x.qty + 1 } : x)))}><Plus size={16} aria-hidden="true" /></button>
              <button type="button" className="btn btn-ghost btn-icon min-h-10 w-10 text-muted" aria-label={`Bỏ ${l.name}`} onClick={() => setLines((s) => s.filter((x) => x.variant_id !== l.variant_id))}><Trash2 size={16} aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1"><span className="label">Khách (không bắt buộc)</span><input className="input" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Tên" /></label>
        <label className="flex flex-col gap-1"><span className="label">Số điện thoại</span><input className="input" inputMode="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></label>
      </div>
      <label className="flex flex-col gap-1"><span className="label">Giảm giá (₫)</span>
        <input className="input" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ''))} placeholder="0" />
        {overLimit ? <span className="text-sm text-warn">Vượt {maxDiscountPct}%: cần tài khoản quản lý thực hiện.</span> : null}
      </label>
      <div className="grid grid-cols-3 gap-2" aria-label="Hình thức thanh toán">
        {([['cash', 'Tiền mặt', Banknote], ['bank_transfer', 'Chuyển khoản', Landmark], ['card', 'Thẻ', CreditCard]] as const).map(([k, l, Icon]) => (
          <button key={k} type="button" aria-pressed={pay === k} onClick={() => setPay(k)} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border text-sm font-semibold ${pay === k ? 'border-ink bg-ink text-white' : 'border-line bg-raised'}`}>
            <Icon size={20} aria-hidden="true" />{l}
          </button>
        ))}
      </div>
      {pay === 'cash' ? (
        <label className="flex flex-col gap-1"><span className="label">Khách đưa</span>
          <input className="input" inputMode="numeric" value={given} onChange={(e) => setGiven(e.target.value.replace(/\D/g, ''))} />
          <span className="flex flex-wrap gap-2 pt-1">{[total, Math.ceil(total / 100000) * 100000, Math.ceil(total / 500000) * 500000].filter((x, i, a) => x > 0 && a.indexOf(x) === i).map((x) => <button key={x} type="button" className="chip" onClick={() => setGiven(String(x))}>{formatVND(x)}</button>)}</span>
          {given ? <span className={`text-sm font-semibold ${change < 0 ? 'text-bad' : 'text-ok'}`}>{change < 0 ? `Còn thiếu ${formatVND(-change)}` : `Tiền thối ${formatVND(change)}`}</span> : null}
        </label>
      ) : null}
      {qrUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrUrl} alt={`VietQR ${formatVND(total)}`} width={180} height={180} className="size-44 self-center" />
      ) : null}
      <div className="mt-auto flex flex-col gap-2 border-t border-line pt-3">
        <div className="flex justify-between text-sm"><span className="text-muted">Tạm tính</span><span className="tabular-nums">{formatVND(subtotal)}</span></div>
        <div className="flex items-baseline justify-between"><span className="font-semibold">Khách cần trả</span><span className="font-sans text-2xl font-bold tabular-nums">{formatVND(total)}</span></div>
        {error ? <p role="alert" className="rounded-lg bg-bad-bg p-2.5 text-sm text-bad">{error}</p> : null}
        <button type="button" className="btn btn-primary btn-lg" disabled={!online || overLimit || lines.some(l=>l.qty>l.stock) || !lines.length || pending || (pay === 'cash' && !!given && change < 0)} onClick={checkout}>
          {pending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}{isDemo ? 'Hoàn tất đơn mẫu' : 'Thu tiền và hoàn tất'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <AdminConnection demo={isDemo} />
      <header className="flex min-h-16 items-center gap-3 border-b border-line bg-raised px-4 text-ink">
        <Link href="/admin" className="btn btn-ghost btn-icon" aria-label="Về trang quản trị"><ArrowLeft size={20} aria-hidden="true" /></Link>
        <b>Bán tại quầy</b>{isDemo ? <span className="pill pill-brand">Demo</span> : null}
        <span className="ml-auto text-xs text-muted">{cashier}</span>
      </header>
      <div className="grid flex-1 lg:grid-cols-[1fr_420px]">
        <section className="flex flex-col gap-4 p-4">
          <label className="input gap-2 bg-raised">
            <ScanLine size={20} className="flex-none text-muted" aria-hidden="true" />
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Quét mã vạch hoặc gõ tên, SKU" aria-label="Tìm sản phẩm" className="min-w-0 flex-1 bg-transparent outline-none"
              onKeyDown={(e) => { if (e.key === 'Enter' && hits[0]) { e.preventDefault(); add(hits[0]) } }} />
            {searching ? <Loader2 size={18} className="animate-spin text-muted" aria-hidden="true" /> : <Search size={18} className="text-muted" aria-hidden="true" />}
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">Tìm theo tên, SKU hoặc máy quét mã vạch.</p><button type="button" className="btn btn-secondary btn-sm" onClick={()=>setScanner(true)}><Camera size={17} aria-hidden="true"/>Quét camera</button></div>
          {searchError ? <p role="alert" className="rounded-xl bg-bad-bg p-3 text-sm text-bad">{searchError}</p> : null}
          {hits.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {hits.map((h) => (
                <li key={h.variant_id}>
                  <button type="button" onClick={() => add(h)} disabled={h.stock <= 0} className="card flex w-full flex-col overflow-hidden text-left hover:border-ink disabled:opacity-50">
                    <ProductImage src={h.image} alt="" sizes="200px" />
                    <span className="flex flex-col gap-0.5 p-2.5"><b className="line-clamp-2 text-sm">{h.name}</b><span className="text-xs text-muted">{h.title !== 'Mặc định' ? `${h.title} · ` : ''}{h.sku}</span><span className="flex justify-between text-sm"><b className="tabular-nums">{formatVND(h.price)}</b><span className={h.stock > 0 ? 'text-muted' : 'text-bad'}>Tồn {h.stock}</span></span></span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">{q.trim().length >= 2 && !searching ? 'Không tìm thấy sản phẩm.' : 'Nhập ít nhất 2 ký tự để tìm. Bạn có thể quét mã bằng camera hoặc máy quét gắn ngoài.'}</p>}
        </section>
        <aside className="hidden border-l border-line bg-raised p-4 lg:block">{cart}</aside>
      </div>
      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line bg-raised p-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
        <span className="flex flex-col"><span className="text-xs text-muted">{lines.reduce((s, l) => s + l.qty, 0)} món</span><b className="tabular-nums">{formatVND(total)}</b></span>
        <button type="button" className="btn btn-primary ml-auto" onClick={() => setShowCart(true)}>Xem đơn và thu tiền</button>
      </div>
      <Dialog open={showCart} onOpenChange={setShowCart}><DialogContent className="pos-cart-dialog"><DialogTitle className="mb-6 pr-10 text-lg font-semibold">Giỏ hàng & thanh toán</DialogTitle><DialogDescription className="sr-only">Kiểm tra sản phẩm và xác nhận thanh toán tại quầy</DialogDescription>{cart}</DialogContent></Dialog>
      <Dialog open={scanner} onOpenChange={setScanner}><DialogContent><DialogTitle className="mb-4 pr-8 text-lg font-semibold">Quét mã sản phẩm</DialogTitle><DialogDescription className="sr-only">Cho phép camera để đọc mã vạch, hoặc nhập mã bằng tay trong ô tìm kiếm.</DialogDescription>{scanner?<BarcodeScanner onScan={(value)=>{setQ(value);setScanner(false)}}/>:null}</DialogContent></Dialog>
    </div>
  )
}
