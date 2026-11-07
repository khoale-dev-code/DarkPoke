import { isPlaceholder } from '@/lib/utils'
import type { ShopSettings } from '@/lib/types'

/** Ảnh VietQR theo chuẩn Napas, tạo bằng dịch vụ img.vietqr.io (miễn phí, không cần khóa). */
export function vietQrUrl(bank: ShopSettings['bank'], amount: number, content: string) {
  if (isPlaceholder(bank.account_no) || isPlaceholder(bank.bank_bin)) return null
  const params = new URLSearchParams({ amount: String(amount), addInfo: content, accountName: bank.account_name })
  return `https://img.vietqr.io/image/${encodeURIComponent(bank.bank_bin)}-${encodeURIComponent(bank.account_no)}-compact2.png?${params}`
}
