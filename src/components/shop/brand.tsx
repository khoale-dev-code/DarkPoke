'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
export function ShopBrand() {
  const [fallback,setFallback]=useState(false)
  return <Link href="/" className="shop-brand" aria-label="Dark Poke, về trang chủ">{fallback?<><span className="shop-brand-mark" aria-hidden="true"/>Dark Poke.</>:<Image src="/logo.png" alt="Dark Poke" width={433} height={112} priority onError={()=>setFallback(true)}/>}</Link>
}
