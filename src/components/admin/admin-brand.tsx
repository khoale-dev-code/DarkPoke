'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export function AdminBrand() {
  const [missing, setMissing] = useState(false)
  return <Link href="/admin" className="admin-brand" aria-label="Dark Poke · Trang quản trị">
    {missing ? <><span className="admin-brand-dot" aria-hidden="true" />Dark Poke<span className="text-brand">.</span></> : <Image src="/logo.png" alt="Dark Poke" width={433} height={112} priority onError={() => setMissing(true)} />}
  </Link>
}
