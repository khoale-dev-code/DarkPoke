'use client'
import { useState, useTransition } from 'react'
import { Check, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { settingSchemas } from '@/lib/schemas/settings'
import { saveSetting } from '@/lib/actions/admin'
import type { ShopSettings } from '@/lib/types'

type Key = keyof ShopSettings
type FieldDef = { k: string; label: string; hint?: string; kind?: 'text' | 'number' | 'bool'; suffix?: string; wide?: boolean }

const SECTIONS: { key: Key; title: string; desc?: string; fields: FieldDef[] }[] = [
  { key: 'shop', title: 'Thông tin cửa hàng', fields: [
    { k: 'name', label: 'Tên shop' }, { k: 'tagline', label: 'Khẩu hiệu' }, { k: 'hotline', label: 'Hotline' }, { k: 'zalo', label: 'Zalo' }, { k: 'email', label: 'Email' }, { k: 'address', label: 'Địa chỉ cửa hàng' }
  ] },
  { key: 'bank', title: 'Thanh toán chuyển khoản (VietQR)', desc: 'Mã BIN ngân hàng theo danh sách Napas, ví dụ Vietcombank 970436, Techcombank 970407, MB 970422, ACB 970416, Sacombank 970403.', fields: [
    { k: 'bank_bin', label: 'Mã BIN ngân hàng' }, { k: 'bank_name', label: 'Tên ngân hàng' }, { k: 'account_no', label: 'Số tài khoản' }, { k: 'account_name', label: 'Chủ tài khoản', hint: 'Viết hoa không dấu như trên app ngân hàng' },
    { k: 'transfer_template', label: 'Mẫu nội dung chuyển khoản', hint: '{code} = mã đơn, {name} = tên khách không dấu', wide: true }
  ] },
  { key: 'shipping', title: 'Vận chuyển', fields: [
    { k: 'hcm', label: 'Phí TP. Hồ Chí Minh', kind: 'number', suffix: '₫' }, { k: 'other', label: 'Phí tỉnh khác', kind: 'number', suffix: '₫' }, { k: 'pickup', label: 'Phí nhận tại shop', kind: 'number', suffix: '₫' },
    { k: 'free_over', label: 'Miễn phí ship từ', kind: 'number', suffix: '₫', hint: 'Để trống nếu không áp dụng' }, { k: 'pickup_hold_days', label: 'Giữ hàng chờ nhận', kind: 'number', suffix: 'ngày' }
  ] },
  { key: 'rules', title: 'Quy tắc nghiệp vụ', desc: 'Các giá trị đề xuất, cần chủ shop chốt.', fields: [
    { k: 'unpaid_cancel_hours', label: 'Tự hủy đơn chưa chuyển khoản sau', kind: 'number', suffix: 'giờ' },
    { k: 'preorder_deposit_pct', label: 'Tỷ lệ cọc pre-order', kind: 'number', suffix: '%' },
    { k: 'preorder_balance_days', label: 'Hạn trả phần còn lại', kind: 'number', suffix: 'ngày' },
    { k: 'cart_hold_minutes', label: 'Giữ món duy nhất trong giỏ', kind: 'number', suffix: 'phút' },
    { k: 'tradein_quote_hours', label: 'Hiệu lực báo giá thu mua', kind: 'number', suffix: 'giờ' },
    { k: 'tradein_approval_limit', label: 'Hạn mức duyệt thu mua', kind: 'number', suffix: '₫', hint: 'Vượt mức cần quản lý' },
    { k: 'cashier_max_discount_pct', label: 'Thu ngân giảm tối đa', kind: 'number', suffix: '%', hint: 'Vượt cần quản lý' }
  ] },
  { key: 'modules', title: 'Mô-đun bán hàng', desc: 'Chọn các tính năng cần dùng. Menu quản trị cập nhật sau khi lưu.', fields: [
    { k: 'preorder', label: 'Pre-order có đặt cọc', kind: 'bool' }, { k: 'tradein', label: 'Thu mua và trade-in', kind: 'bool' }, { k: 'cart_hold', label: 'Giữ hàng trong giỏ', kind: 'bool' },
    { k: 'pos', label: 'Bán tại quầy (POS)', kind: 'bool' }, { k: 'attribute_filters', label: 'Bộ lọc theo thuộc tính', kind: 'bool' }
  ] }
]

export function SettingsForms({ initial, readOnly, section = 'shop' }: { initial:ShopSettings; readOnly:boolean; section?:Key }) {
  const def=SECTIONS.find((s)=>s.key===section) ?? SECTIONS[0]!
  return <><nav className="admin-settings-nav" aria-label="Nhóm cài đặt">{SECTIONS.map((s)=><Link key={s.key} href={`/admin/cai-dat?section=${s.key}`} aria-current={def.key===s.key?'page':undefined}>{s.key==='bank'?'Thanh toán':s.key==='rules'?'Quy tắc':s.key==='modules'?'Mô-đun':s.title}</Link>)}</nav><SettingSection key={def.key} def={def} value={initial[def.key] as unknown as Record<string,unknown>} readOnly={readOnly}/></>
}
function SettingSection({def,value,readOnly}:{def:(typeof SECTIONS)[number];value:Record<string,unknown>;readOnly:boolean}) {
  const [pending,start]=useTransition()
  const [msg,setMsg]=useState<{ok:boolean;text:string}|null>(null)
  const {register,handleSubmit,reset,formState:{errors,isDirty}}=useForm<Record<string,unknown>>({defaultValues:value,resolver:zodResolver(settingSchemas[def.key]) as unknown as Resolver<Record<string,unknown>>})
  return <form className="card overflow-hidden" onSubmit={handleSubmit((data)=>start(async()=>{
    setMsg(null)
    try { const r=await saveSetting(def.key,data);setMsg(r.ok?{ok:true,text:r.message??'Đã lưu'}:{ok:false,text:r.error});if(r.ok)reset(data) }
    catch {setMsg({ok:false,text:'Chưa kết nối được máy chủ. Hãy kiểm tra mạng rồi lưu lại.'})}
  }))} noValidate>
    <div className="admin-section-head"><div><h2>{def.title}</h2>{def.desc?<p className="hint mt-2 max-w-3xl">{def.desc}</p>:null}</div>{readOnly?<span className="pill pill-neu">Chỉ xem</span>:null}</div>
    <fieldset disabled={readOnly||pending} className="admin-section-body">
      <div className="grid items-start gap-5 sm:grid-cols-2">{def.fields.filter((f)=>f.kind!=='bool').map((f)=>{
        const id=`setting-${def.key}-${f.k}`;const error=errors[f.k]?.message
        return <label htmlFor={id} key={f.k} className={`flex flex-col gap-2 ${f.wide?'sm:col-span-2':''}`}><span className="label">{f.label}</span><span className="relative"><input id={id} {...register(f.k,f.kind==='number'?{setValueAs:(v:unknown)=>v===''?(f.k==='free_over'?null:NaN):Number(v)}:undefined)} type={f.kind==='number'?'number':'text'} min={f.kind==='number'?0:undefined} className={`input ${f.suffix?'!pr-16':''}`} inputMode={f.kind==='number'?'numeric':undefined} aria-invalid={!!error} aria-describedby={error?`${id}-error`:f.hint?`${id}-hint`:undefined}/>{f.suffix?<span className="pointer-events-none absolute top-3 right-3 text-sm text-muted">{f.suffix}</span>:null}</span>{f.hint?<span id={`${id}-hint`} className="hint">{f.hint}</span>:null}{error?<span id={`${id}-error`} role="alert" className="text-xs text-bad">{String(error)}</span>:null}</label>
      })}</div>
      {def.fields.filter((f)=>f.kind==='bool').map((f)=><label key={f.k} className="flex min-h-16 items-center justify-between gap-4 border-b border-line py-3 last:border-0"><span className="label">{f.label}</span><input type="checkbox" className="switch" {...register(f.k)}/></label>)}
    </fieldset>
    <div className="flex flex-wrap items-center gap-3 border-t border-line bg-surface/50 px-5 py-4">{!readOnly?<><span className="mr-auto text-xs text-muted">{isDirty?'Chưa lưu thay đổi. Lưu trước khi chuyển nhóm.':'Các thay đổi đã được lưu.'}</span><button className="btn btn-primary" type="submit" disabled={pending||!isDirty}>{pending?<Loader2 size={16} className="animate-spin" aria-hidden="true"/>:<Save size={16} aria-hidden="true"/>}Lưu thay đổi</button></>:<p className="text-xs text-muted">Liên hệ chủ shop để cập nhật cài đặt.</p>}{msg?<p role={msg.ok?'status':'alert'} className={`flex w-full items-center gap-2 text-sm ${msg.ok?'text-ok':'text-bad'}`}>{msg.ok?<Check size={16} aria-hidden="true"/>:null}{msg.text}</p>:null}</div>
  </form>
}
