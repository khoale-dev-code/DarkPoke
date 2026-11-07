'use client'
import { useFormContext, useWatch } from 'react-hook-form'
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { MAX_PHOTOS, type TradeinInput } from '../domain'

const METHOD = { store: 'Mang đến cửa hàng', ship: 'Gửi qua vận chuyển' } as const
const PAYOUT = { cash: 'Tiền mặt / chuyển khoản', credit: 'Tín dụng mua hàng' } as const

/** Sticky summary on desktop, last block on phones: what is being sent, and the submit button. */
export function TradeinSummary({ quoteHours, photos, pending, error, progress }: { quoteHours: number; photos: number; pending: boolean; error: string; progress: string }) {
  const { control } = useFormContext<TradeinInput>()
  const [items, method, payout] = useWatch({ control, name: ['items', 'method', 'payout'] })
  const list = items ?? []
  const named = list.filter((i) => (i?.name ?? '').trim().length >= 2).length
  const qty = list.reduce((sum, i) => sum + (Number.isFinite(i?.qty) ? Number(i.qty) : 0), 0)

  return <aside className="tx-summary" data-tradein-section aria-labelledby="tx-summary-title">
    <h2 id="tx-summary-title">Yêu cầu của bạn</h2>
    <dl>
      <div><dt>Vật phẩm</dt><dd>{list.length}{named < list.length ? <small> · {list.length - named} chưa có tên</small> : null}</dd></div>
      <div><dt>Tổng số lượng</dt><dd>{qty}</dd></div>
      <div><dt>Ảnh thực tế</dt><dd>{photos}/{MAX_PHOTOS}</dd></div>
      <div><dt>Cách gửi</dt><dd>{METHOD[method ?? 'store']}</dd></div>
      <div><dt>Nhận giá trị</dt><dd>{PAYOUT[payout ?? 'cash']}</dd></div>
    </dl>
    <button type="submit" className="btn btn-primary tx-submit" disabled={pending}>
      {pending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}{pending ? 'Đang gửi…' : 'Gửi yêu cầu báo giá'}{!pending ? <ArrowRight size={18} aria-hidden="true" /> : null}
    </button>
    <p className="tx-summary-note">Báo giá trong {quoteHours} giờ. Giá cuối cùng chốt sau khi shop kiểm tra vật phẩm thực tế.</p>
    {error ? <div className="tx-alert" role="alert">{error}</div> : null}
    <p role="status" className="tx-progress">{progress}</p>
    <p className="tx-privacy"><ShieldCheck size={16} aria-hidden="true" />Ảnh được lưu riêng tư, chỉ nhân viên có quyền mới xem được. Tránh để thông tin cá nhân trong khung hình.</p>
  </aside>
}
