<#
  Bản vá Dark Poke: sửa lỗi "Invalid src prop ... hostname is not configured" khi sản phẩm dùng ảnh từ tên miền ngoài.
  Cách chạy (trong thư mục dự án):
    powershell -NoProfile -ExecutionPolicy Bypass -File ".\patch-anh-ngoai.ps1" -DryRun
    powershell -NoProfile -ExecutionPolicy Bypass -File ".\patch-anh-ngoai.ps1"
#>
[CmdletBinding()]
param([switch]$DryRun)
$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
$Root = $PSScriptRoot
if (-not $Root) { $Root = (Get-Location).Path }
if (-not (Test-Path -LiteralPath (Join-Path $Root 'package.json'))) { Write-Host 'Hãy đặt file này trong thư mục dự án dark-poke rồi chạy lại.' -ForegroundColor Red; exit 1 }
$Utf8 = New-Object System.Text.UTF8Encoding($false)
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$BackupDir = Join-Path $Root ".patch-backup\$Stamp"

function Write-ProjectFile([string]$Rel, [string]$Content) {
  $path = Join-Path $Root $Rel
  if ($DryRun) { Write-Host "  [SẼ LÀM] Ghi đè $Rel (sao lưu bản cũ vào .patch-backup\$Stamp)" -ForegroundColor Magenta; return }
  if (Test-Path -LiteralPath $path) {
    $bak = Join-Path $BackupDir $Rel
    New-Item -ItemType Directory -Force -Path (Split-Path $bak) | Out-Null
    Copy-Item -LiteralPath $path -Destination $bak -Force
  }
  New-Item -ItemType Directory -Force -Path (Split-Path $path) | Out-Null
  $body = ($Content -replace "`r`n", "`n")
  if (-not $body.EndsWith("`n")) { $body += "`n" }
  [System.IO.File]::WriteAllText($path, $body, $Utf8)
  Write-Host "  [OK]   Đã cập nhật $Rel" -ForegroundColor Green
}

function Add-EnvLine([string]$Rel) {
  $path = Join-Path $Root $Rel
  if (-not (Test-Path -LiteralPath $path)) { return }
  $text = [System.IO.File]::ReadAllText($path)
  if ($text -match '(?m)^NEXT_PUBLIC_IMAGE_HOSTS=') { Write-Host "  [OK]   $Rel đã có NEXT_PUBLIC_IMAGE_HOSTS" -ForegroundColor Green; return }
  if ($DryRun) { Write-Host "  [SẼ LÀM] Thêm NEXT_PUBLIC_IMAGE_HOSTS= vào $Rel" -ForegroundColor Magenta; return }
  $add = "`n# Tên miền ảnh ngoài muốn tối ưu qua next/image, cách nhau dấu phẩy (không bắt buộc)`nNEXT_PUBLIC_IMAGE_HOSTS=`n"
  [System.IO.File]::AppendAllText($path, $add, $Utf8)
  Write-Host "  [OK]   Đã thêm NEXT_PUBLIC_IMAGE_HOSTS vào $Rel" -ForegroundColor Green
}

Write-Host ''
Write-Host 'Bản vá: ảnh sản phẩm từ tên miền ngoài' -ForegroundColor Cyan

Write-ProjectFile 'src\components\shop\product-image.tsx' @'
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
'@

Write-ProjectFile 'next.config.ts' @'
import type { NextConfig } from 'next'

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined
  } catch {
    return undefined
  }
})()

// Tên miền ảnh ngoài muốn tối ưu (AVIF/WebP), ví dụ NEXT_PUBLIC_IMAGE_HOSTS=cdn.shop.vn,images.example.com
const extraImageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean)

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600],
    imageSizes: [48, 64, 96, 128, 200, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      ...(supabaseHost ? [{ protocol: 'https' as const, hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }] : []),
      { protocol: 'https', hostname: 'img.vietqr.io' },
      ...extraImageHosts.map((hostname) => ({ protocol: 'https' as const, hostname }))
    ]
  },
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' }
        ]
      },
      {
        source: '/art/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
      }
    ]
  }
}

export default nextConfig
'@

Add-EnvLine '.env.example'
Add-EnvLine '.env.local'

Write-Host ''
if ($DryRun) { Write-Host 'Chạy thử xong, chưa thay đổi gì.' -ForegroundColor Green; exit 0 }
Write-Host 'Xong. Tắt server đang chạy (Ctrl + C) rồi chạy lại: powershell -NoProfile -ExecutionPolicy Bypass -File ".\setup.ps1"' -ForegroundColor Green
Write-Host 'Lý do: next.config.ts và biến môi trường chỉ được đọc khi khởi động server.' -ForegroundColor Gray
