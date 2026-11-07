'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Grid2x2,Home,ShoppingBag,User } from 'lucide-react'
import { cartCount,useCart } from '@/lib/cart'
const TABS=[{href:'/',label:'Trang chủ',icon:Home},{href:'/san-pham',label:'Khám phá',icon:Grid2x2},{href:'/gio-hang',label:'Giỏ hàng',icon:ShoppingBag},{href:'/tai-khoan',label:'Tài khoản',icon:User}]
export function MobileTabs() {const path=usePathname().replace(/\/$/,'')||'/';const n=cartCount(useCart());if(path.startsWith('/thanh-toan')||path.startsWith('/don-hang')||path.startsWith('/san-pham/'))return null;return <nav className="shop-mobile-nav" aria-label="Điều hướng nhanh">{TABS.map(t=>{const on=t.href==='/'?path==='/':t.href==='/san-pham'?path.startsWith('/san-pham')||path.startsWith('/danh-muc')||path==='/pre-order':path.startsWith(t.href);return <Link key={t.href} href={t.href} aria-current={on?'page':undefined}><t.icon size={21} strokeWidth={1.7} aria-hidden="true"/><span>{t.label}</span>{t.href==='/gio-hang'&&n>0?<span className="shop-cart-count">{n>99?'99+':n}</span>:null}</Link>})}</nav>}
