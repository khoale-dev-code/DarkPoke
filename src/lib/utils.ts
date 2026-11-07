import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Bỏ dấu tiếng Việt, khớp với hàm f_unaccent(lower()) trong Postgres. */
export function unaccent(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

export function slugify(s: string) {
  return unaccent(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

const vnd = new Intl.NumberFormat('vi-VN')
export function formatVND(n: number | null | undefined) {
  if (n === null || n === undefined) return 'Liên hệ'
  return `${vnd.format(n)}₫`
}

const dt = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const d = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' })
export function formatDateTime(s: string | null | undefined) {
  return s ? dt.format(new Date(s)) : ''
}
export function formatDate(s: string | null | undefined) {
  return s ? d.format(new Date(s)) : ''
}

export function priceRange(p: { price: number; min_price: number | null; max_price: number | null }) {
  const min = p.min_price ?? p.price
  const max = p.max_price ?? p.price
  return min === max ? formatVND(min) : `từ ${formatVND(min)}`
}

/** Nội dung chuyển khoản: mã đơn + tên không dấu (ngân hàng thường bỏ dấu). */
export function transferContent(template: string, code: string, name: string) {
  return (template || '{code}')
    .replace('{code}', code)
    .replace('{name}', unaccent(name).toUpperCase())
    .replace(/[^A-Za-z0-9 -]/g, '')
    .trim()
    .slice(0, 50)
}

export function isPlaceholder(v: string | null | undefined) {
  return !v || /^\[.*\]$/.test(v.trim())
}
