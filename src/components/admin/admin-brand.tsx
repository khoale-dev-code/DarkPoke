'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

/** Admin logo (V14.34: RolPoké). Falls back to text if the file is missing. */
export function AdminBrand() {
  const [missing, setMissing] = useState(false)
  return <Link href="/admin" className="admin-brand" aria-label="RolPoké · Trang quản trị">
    {missing ? <><span className="admin-brand-dot" aria-hidden="true" />RolPoké</> : <Image src="/brand/rolpoke-logo.png" alt="RolPoké" width={584} height={202} priority onError={() => setMissing(true)} />}
  </Link>
}
