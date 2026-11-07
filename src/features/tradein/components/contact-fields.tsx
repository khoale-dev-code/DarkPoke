'use client'
import { useId } from 'react'
import { useFormContext } from 'react-hook-form'
import { Banknote, ShoppingBag, Store, Truck } from 'lucide-react'
import type { TradeinInput } from '../domain'

/** Contact details, then how the item reaches the shop and how the seller is paid, as two-option cards. */
export function ContactFields() {
  const id = useId(); const { register, formState: { errors } } = useFormContext<TradeinInput>()
  return <div className="tx-contact">
    <div className="tx-row">
      <label className="tx-field" htmlFor={`${id}-name`}><span className="tx-label">Họ và tên <em>*</em></span><input id={`${id}-name`} className="tx-input" autoComplete="name" placeholder="Tên để shop xưng hô" aria-invalid={!!errors.name} aria-describedby={errors.name ? `${id}-name-error` : undefined} {...register('name')} />{errors.name ? <small className="tx-error" id={`${id}-name-error`}>{errors.name.message}</small> : null}</label>
      <label className="tx-field" htmlFor={`${id}-phone`}><span className="tx-label">Số điện thoại <em>*</em></span><input id={`${id}-phone`} className="tx-input" type="tel" inputMode="tel" autoComplete="tel" placeholder="0901 234 567" aria-invalid={!!errors.phone} aria-describedby={`${id}-phone-hint`} {...register('phone')} /><small id={`${id}-phone-hint`} className={errors.phone ? 'tx-error' : 'tx-hint'}>{errors.phone?.message ?? 'Shop dùng số này để trao đổi về yêu cầu thu mua.'}</small></label>
    </div>
    <label className="tx-field" htmlFor={`${id}-email`}><span className="tx-label">Email <small>Không bắt buộc</small></span><input id={`${id}-email`} className="tx-input" type="email" autoComplete="email" placeholder="ten@email.com" aria-invalid={!!errors.email} {...register('email')} />{errors.email ? <small className="tx-error">{errors.email.message}</small> : null}</label>
    <fieldset className="tx-field">
      <legend className="tx-label">Bạn muốn gửi vật phẩm thế nào?</legend>
      <div className="tx-choice-grid tx-choice-2">
        <label className="tx-choice tx-choice-icon"><input type="radio" value="store" {...register('method')} /><Store size={20} aria-hidden="true" /><span><b>Mang đến cửa hàng</b><small>Kiểm tra và chốt giá ngay tại shop.</small></span></label>
        <label className="tx-choice tx-choice-icon"><input type="radio" value="ship" {...register('method')} /><Truck size={20} aria-hidden="true" /><span><b>Gửi qua vận chuyển</b><small>Qua bưu điện hoặc đơn vị vận chuyển.</small></span></label>
      </div>
    </fieldset>
    <fieldset className="tx-field">
      <legend className="tx-label">Nhận giá trị thu mua bằng</legend>
      <div className="tx-choice-grid tx-choice-2">
        <label className="tx-choice tx-choice-icon"><input type="radio" value="cash" {...register('payout')} /><Banknote size={20} aria-hidden="true" /><span><b>Tiền mặt hoặc chuyển khoản</b><small>Nhận tiền khi hoàn tất giao dịch.</small></span></label>
        <label className="tx-choice tx-choice-icon"><input type="radio" value="credit" {...register('payout')} /><ShoppingBag size={20} aria-hidden="true" /><span><b>Tín dụng mua hàng</b><small>Dùng để mua sản phẩm tại Dark Poke.</small></span></label>
      </div>
    </fieldset>
    <label className="tx-field" htmlFor={`${id}-note`}><span className="tx-label">Lời nhắn cho shop <small>Không bắt buộc</small></span><textarea id={`${id}-note`} className="tx-input" rows={3} maxLength={1000} placeholder="Ví dụ: khung giờ tiện nghe máy, thông tin thêm về bộ sưu tập…" {...register('note')} />{errors.note ? <small className="tx-error">{errors.note.message}</small> : null}</label>
  </div>
}
