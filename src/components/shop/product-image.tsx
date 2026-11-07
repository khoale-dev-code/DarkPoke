import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Props {
  src: string | null | undefined
  alt: string
  sizes?: string
  priority?: boolean
  className?: string
}

const SUPABASE_HOST = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.toLowerCase() : ''
  } catch {
    return ''
  }
})()

/** Tên miền ảnh ngoài được tối ưu qua next/image, khai báo trong NEXT_PUBLIC_IMAGE_HOSTS (cách nhau bằng dấu phẩy). */
const EXTRA_HOSTS = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean)

/** Chỉ ảnh trong public/, kho ảnh Supabase hoặc tên miền đã khai báo mới đi qua next/image. Ảnh từ nơi khác hiện bằng <img> thường để không lỗi. */
function canOptimize(src: string) {
  if (src.startsWith('/') && !src.startsWith('//')) return true
  try {
    const u = new URL(src)
    if (u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    if (SUPABASE_HOST && host === SUPABASE_HOST) return u.pathname.startsWith('/storage/v1/object/public/')
    return EXTRA_HOSTS.includes(host)
  } catch {
    return false
  }
}

/** Ảnh sản phẩm khung vuông, tỷ lệ cố định để không nhảy bố cục. */
export function ProductImage({ src, alt, sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px', priority, className }: Props) {
  const box = cn('relative block aspect-square overflow-hidden bg-surface', className)
  if (!src) {
    return <span className={cn(box, 'flex items-center justify-center text-xs text-muted')}>Chưa có ảnh</span>
  }
  const isSvg = /\.svg(\?|$)/i.test(src) || src.startsWith('data:')
  if (isSvg || !canOptimize(src)) {
    return (
      <span className={box}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={400}
          height={400}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          referrerPolicy="no-referrer"
          className="size-full object-cover"
        />
      </span>
    )
  }
  return (
    <span className={box}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </span>
  )
}
