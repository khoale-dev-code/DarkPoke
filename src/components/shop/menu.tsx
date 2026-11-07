'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, ArrowUpRight, User } from 'lucide-react'
import { ShopDialog } from '@/components/shop/dialog'
export function ShopMenu({links,categories}:{links:{href:string;label:string}[];categories:{id:string;name:string;slug:string}[]}) {
  const [open,setOpen]=useState(false)
  return <><button type="button" className="btn btn-ghost btn-icon shop-menu-toggle" aria-label="Mở danh mục và menu" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}><Menu size={24} aria-hidden="true"/><span>Danh mục</span></button><ShopDialog open={open} onClose={()=>setOpen(false)} title="Khám phá Dark Poke" drawer><nav className="shop-menu-links" aria-label="Menu cửa hàng">{links.map(n=><Link key={n.href} href={n.href} onClick={()=>setOpen(false)} className="flex items-center justify-between">{n.label}<ArrowUpRight size={16} aria-hidden="true"/></Link>)}</nav>{categories.length?<><p className="shop-eyebrow mt-7 mb-4">Danh mục</p><nav className="shop-menu-links" aria-label="Danh mục">{categories.map(c=><Link key={c.id} href={`/danh-muc/${c.slug}`} onClick={()=>setOpen(false)}>{c.name}</Link>)}</nav></>:null}<Link href="/tai-khoan" className="btn btn-secondary mt-7 w-full" onClick={()=>setOpen(false)}><User size={17} aria-hidden="true"/>Tài khoản & đơn hàng</Link></ShopDialog></>
}
