'use client'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { cartCount,useCart } from '@/lib/cart'
export function CartButton({className='shop-cart-link'}:{className?:string}) {const n=cartCount(useCart());return <Link href="/gio-hang" className={className} aria-label={n?`Giỏ hàng, ${n} sản phẩm`:'Giỏ hàng'}><ShoppingBag size={23} strokeWidth={1.6} aria-hidden="true"/><span className="cart-label">Giỏ hàng</span><span className="shop-cart-count" aria-hidden="true">{n>99?'99+':n}</span></Link>}
