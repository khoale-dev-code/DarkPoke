'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

/**
 * V14.34: RolPoké logo. Two files: blue `/brand/rolpoke-logo.png` for light surfaces and white `/brand/rolpoke-logo-white.png` for dark ones
 * (footer, header over the hero). CSS shows the right one, so the logo always has contrast.
 */
export function ShopBrand() {
  const [fallback, setFallback] = useState(false)
  return <Link href="/" className="shop-brand" aria-label="RolPoké, về trang chủ">
    {fallback ? <><span className="shop-brand-mark" aria-hidden="true" />RolPoké</> : <>
      <Image className="shop-logo shop-logo-light" src="/brand/rolpoke-logo.png" alt="RolPoké" width={584} height={202} priority onError={() => setFallback(true)} />
      <Image className="shop-logo shop-logo-dark" src="/brand/rolpoke-logo-white.png" alt="" aria-hidden="true" width={584} height={202} priority />
    </>}
  </Link>
}
