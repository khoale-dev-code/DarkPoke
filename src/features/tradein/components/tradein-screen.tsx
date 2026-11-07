'use client'
import Link from 'next/link'
import { useRef } from 'react'
import { FormProvider } from 'react-hook-form'
import { Check, Plus } from 'lucide-react'
import { useTradeinForm } from '../hooks/use-tradein-form'
import { useTradeinMotion } from '../animation/use-tradein-motion'
import { ItemCard } from './item-card'
import { ContactFields } from './contact-fields'
import { TradeinSummary } from './tradein-summary'
import '../tradein.css'

/** V14.22 trade-in page: short intro with the three steps, the form on the left, a sticky request summary with the submit button on the right. */
export function TradeinScreen({ quoteHours }: { quoteHours: number }) {
  const root = useRef<HTMLDivElement>(null); useTradeinMotion(root)
  const model = useTradeinForm(); const { form, fields, media } = model; const pending = form.formState.isSubmitting
  const steps = [
    { title: 'Gửi thông tin', text: 'Tên, tình trạng và ảnh thực tế của vật phẩm.' },
    { title: 'Nhận báo giá', text: `Shop liên hệ báo giá trong ${quoteHours} giờ.` },
    { title: 'Hoàn tất tại shop', text: 'Kiểm tra vật phẩm thực tế rồi chốt giá.' }
  ]

  return <div ref={root} className="tx shop-container">
    <nav className="tx-crumbs" aria-label="Đường dẫn"><Link href="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">Thu mua &amp; trao đổi</span></nav>
    <header className="tx-hero">
      <h1>Bán hoặc đổi thẻ bài của bạn</h1>
      <p>Kể cho Dark Poke về vật phẩm, kèm ảnh thực tế. Shop báo giá trong {quoteHours} giờ, bạn chưa cần gửi hàng ở bước này.</p>
      <ol className="tx-steps" aria-label="Quy trình thu mua">
        {steps.map((s, i) => <li key={s.title} data-tradein-step><span className="tx-step-no">{i + 1}</span><div><b>{s.title}</b><small>{s.text}</small></div></li>)}
      </ol>
    </header>

    {model.success ? <section className="tx-success" role="status">
      <span className="tx-success-icon"><Check size={30} aria-hidden="true" /></span>
      <h2>{model.isDemo ? 'Đã tạo yêu cầu minh họa' : 'Đã gửi yêu cầu báo giá'}</h2>
      <p>{model.isDemo ? 'Thông tin và ảnh chỉ được xem thử trên thiết bị, chưa được gửi tới cửa hàng.' : <>Mã yêu cầu <b className="tx-code">{model.success}</b>. Shop sẽ liên hệ qua số điện thoại bạn cung cấp trong {quoteHours} giờ.</>}</p>
      <div><button type="button" className="btn btn-primary" onClick={model.reset}><Plus size={17} aria-hidden="true" />Gửi thêm vật phẩm</button><Link href="/san-pham" className="btn btn-secondary">Xem sản phẩm</Link></div>
    </section> : <FormProvider {...form}>
      <form id="tradein-form" className="tx-layout" onSubmit={model.submit} noValidate aria-busy={pending}>
        <fieldset className="tx-main" disabled={pending}>
          <section className="tx-section" data-tradein-section aria-labelledby="tx-items-title">
            <div className="tx-section-head"><span className="tx-section-no">1</span><div><h2 id="tx-items-title">Vật phẩm bạn muốn bán</h2><p>Mỗi vật phẩm một thẻ riêng. Mục có dấu <em>*</em> là bắt buộc.</p></div></div>
            <div className="tx-items">{fields.fields.map((field, index) => <ItemCard key={field.id} index={index} canRemove={fields.fields.length > 1} photos={media.photos.filter((p) => p.itemId === field.client_id)} total={media.photos.length} disabled={pending} onRemove={() => model.removeItem(index)} onAddPhotos={(files) => media.add(field.client_id, files)} onRemovePhoto={media.remove} />)}</div>
            {media.errors.length ? <ul className="tx-alert" role="alert">{media.errors.map((error, i) => <li key={`${i}:${error}`}>{error}</li>)}</ul> : null}
            <button type="button" className="tx-add" disabled={pending || fields.fields.length >= 50} onClick={model.addItem}><Plus size={18} aria-hidden="true" />Thêm vật phẩm khác</button>
          </section>
          <section className="tx-section" data-tradein-section aria-labelledby="tx-contact-title">
            <div className="tx-section-head"><span className="tx-section-no">2</span><div><h2 id="tx-contact-title">Thông tin liên hệ</h2><p>Shop dùng số điện thoại này để liên hệ báo giá.</p></div></div>
            <ContactFields />
          </section>
        </fieldset>
        <TradeinSummary quoteHours={quoteHours} photos={media.photos.length} pending={pending} error={model.error} progress={model.progress} />
      </form>
    </FormProvider>}
  </div>
}
