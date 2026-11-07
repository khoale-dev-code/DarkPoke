import type { ProductStatus } from '@/lib/types'
/** Shared, dependency-free query validation. The server owns pagination and sort. */
export const ADMIN_PAGE_SIZE = 20
export function adminPage(value: unknown) { const n = Number(value); return Number.isFinite(n) && n >= 1 ? Math.min(100_000, Math.floor(n)) : 1 }
export const PRODUCT_SORTS = { newest: ['created_at', false], 'name-asc': ['name', true], 'price-asc': ['min_price', true], 'price-desc': ['min_price', false], 'stock-asc': ['stock_total', true] } as const
export type ProductSort = keyof typeof PRODUCT_SORTS
export function productSort(value?: string): ProductSort { return value && Object.hasOwn(PRODUCT_SORTS,value) ? value as ProductSort : 'newest' }
export function csvCell(value: unknown) { let s = String(value ?? ''); if (/^[\s]*[=+@\-]/.test(s)) s = "'" + s; return '"' + s.replaceAll('"','""') + '"' }

export function productStatus(value?:string): ProductStatus | undefined { return value && ['draft','active','hidden','archived'].includes(value) ? value as ProductStatus : undefined }
