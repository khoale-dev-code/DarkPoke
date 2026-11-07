'use client'
import Link from 'next/link'
import { useEffect,useMemo,useRef,useState,useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight,Check,Loader2,Minus,Plus,ShoppingBag } from 'lucide-react'
import { ShopDialog } from '@/components/shop/dialog'
import { cart,useCart } from '@/lib/cart'
import { formatVND } from '@/lib/utils'
import type { ProductOption,Variant } from '@/lib/types'
interface Props {product:{id:string;slug:string;name:string;price:number;thumbnail:string|null;allow_preorder:boolean;purchase_limit:number|null;compare_at_price:number|null;preorder_slots?:number|null};variants:Variant[];options:ProductOption[];isUnique:boolean;trackInventory:boolean;depositPct?:number}
export function AddToCart({product,variants,options,isUnique,trackInventory,depositPct}:Props) {
  const router=useRouter();const lines=useCart();const active=useMemo(()=>variants.filter(v=>v.active),[variants]);const first=active.find(v=>v.stock>0)??active[0]
  const [picked,setPicked]=useState<string[]>(first?.option_values??[]);const [qty,setQty]=useState(1);const [added,setAdded]=useState(false);const [intent,setIntent]=useState<'add'|'buy'|null>(null);const [pending,start]=useTransition();const timer=useRef<ReturnType<typeof setTimeout>|null>(null)
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[])
  const variant=useMemo(()=>!options.length?active[0]:active.find(v=>options.every((_,j)=>v.option_values[j]===picked[j])),[active,options,picked])
  const price=variant?.price??product.price;const pre=product.allow_preorder;const stock=variant?.stock??0
  const max=pre?Math.min(product.purchase_limit??5,product.preorder_slots??Infinity):isUnique?1:!trackInventory?(product.purchase_limit??99):Math.min(stock,product.purchase_limit??99)
  const safeQty=Math.max(1,Math.min(qty,max));const canBuy=!!variant&&max>0&&(pre||!trackInventory||stock>0)
  function apply(goCheckout:boolean) {
    if(!variant||!canBuy)return
    cart.add({variantId:variant.id,productId:product.id,slug:product.slug,name:product.name,variantTitle:options.length?variant.title:'',price,image:variant.image_url??product.thumbnail,max:Math.max(max,1),isPreorder:pre},safeQty)
    setIntent(null)
    if(goCheckout)start(()=>router.push('/gio-hang'))
    else {setAdded(true);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setAdded(false),2400)}
  }
  function request(goCheckout:boolean) {if(!canBuy)return;if(lines.some(l=>l.isPreorder!==pre)){setIntent(goCheckout?'buy':'add');return}apply(goCheckout)}
  return <div className="shop-buybox"><div className="shop-buy-price"><span className="pd-price-label">{pre?'Giá đặt trước':'Giá bán'}</span><strong>{formatVND(price)}</strong>{product.compare_at_price&&product.compare_at_price>price?<><del>{formatVND(product.compare_at_price)}</del><span className="pd-save">-{Math.round((1-price/product.compare_at_price)*100)}% · Tiết kiệm {formatVND(product.compare_at_price-price)}</span></>:null}</div>
    {options.map((o,i)=><fieldset key={o.id}><legend className="label mb-3">{o.name}<span className="ml-2 font-normal text-muted">{picked[i]}</span></legend><div className="flex flex-wrap gap-2">{o.values.map(val=>{const exists=active.some(v=>v.option_values[i]===val&&(pre||!trackInventory||v.stock>0));return <button key={val} type="button" className="chip" disabled={!exists} aria-pressed={picked[i]===val} onClick={()=>{setPicked(s=>{const n=[...s];n[i]=val;return n});setAdded(false)}}>{val}</button>})}</div></fieldset>)}
    <p className="text-xs leading-relaxed" aria-live="polite">{!variant?<span className="pill pill-neu">Lựa chọn này chưa có hàng</span>:!canBuy?<span className="pill pill-neu">{pre?'Hết suất đặt trước':'Sản phẩm tạm hết hàng'}</span>:pre?<span className="pill pill-brand">Đặt trước{depositPct?` · Cọc ${depositPct}%`:''}</span>:trackInventory?<span className="pill pill-ok">{isUnique?'Còn 1 món duy nhất':`Còn ${stock} sản phẩm`}</span>:<span className="pill pill-ok">Có thể đặt hàng</span>}</p>
    {max>1?<div className="flex flex-wrap items-center justify-between gap-3"><span className="label">Số lượng</span><div className="shop-quantity" role="group" aria-label="Số lượng sản phẩm"><button type="button" className="btn btn-ghost btn-icon" disabled={safeQty<=1} aria-label="Giảm số lượng" onClick={()=>setQty(Math.max(1,safeQty-1))}><Minus size={17} aria-hidden="true"/></button><input inputMode="numeric" aria-label="Số lượng" value={safeQty} onChange={e=>setQty(Math.max(1,Math.min(max,Number(e.target.value.replace(/\D/g,''))||1)))}/><button type="button" className="btn btn-ghost btn-icon" disabled={safeQty>=max} aria-label="Tăng số lượng" onClick={()=>setQty(Math.min(max,safeQty+1))}><Plus size={17} aria-hidden="true"/></button></div></div>:null}
    <div className="shop-buy-actions"><button type="button" className="btn btn-secondary btn-lg" disabled={!canBuy||pending} onClick={()=>request(false)}>{added?<Check size={17} aria-hidden="true"/>:<ShoppingBag size={17} aria-hidden="true"/>}{added?'Đã thêm vào giỏ':'Thêm vào giỏ'}</button><button type="button" className="btn btn-primary btn-lg" disabled={!canBuy||pending} onClick={()=>request(true)}>{pending?<Loader2 size={17} className="animate-spin" aria-hidden="true"/>:null}{pre?'Đặt trước ngay':'Mua ngay'}<ArrowRight size={16} aria-hidden="true"/></button></div>
    <div role="status" aria-live="polite">{added?<p className="shop-buy-feedback">Đã thêm {safeQty} sản phẩm. <Link href="/gio-hang" className="font-semibold underline underline-offset-4">Xem giỏ hàng</Link></p>:null}</div>
    {pre?<p className="text-[11px] leading-relaxed text-muted">Hàng đặt trước được tạo đơn riêng. Số tiền cọc chính xác hiển thị sau khi tạo đơn.</p>:null}
    <div className="shop-buy-mobile"><span><small>{pre?'Giá sản phẩm đặt trước':'Giá sản phẩm'}</small><strong>{formatVND(price)}</strong></span><button type="button" className="btn btn-secondary btn-icon" disabled={!canBuy||pending} aria-label="Thêm sản phẩm vào giỏ" onClick={()=>request(false)}>{added?<Check size={19} aria-hidden="true"/>:<ShoppingBag size={19} aria-hidden="true"/>}</button><button type="button" className="btn btn-primary" disabled={!canBuy||pending} onClick={()=>request(true)}>{pending?'Đang mở…':pre?'Đặt trước':'Mua ngay'}</button></div>
    <ShopDialog open={intent!==null} onClose={()=>setIntent(null)} title="Tạo giỏ hàng riêng?" description="Hàng có sẵn và hàng đặt trước cần tạo đơn riêng. Nếu tiếp tục, những món trong giỏ hiện tại sẽ được thay thế." actions={<><button type="button" className="btn btn-secondary" onClick={()=>setIntent(null)}>Giữ giỏ hiện tại</button><button type="button" className="btn btn-primary" onClick={()=>apply(intent==='buy')}>Thay giỏ hàng</button></>}><p className="text-sm text-muted">Bạn có thể hoàn tất giỏ hiện tại trước rồi quay lại đặt sản phẩm này.</p></ShopDialog>
  </div>
}
