import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BadgeCheck, CalendarClock, PackageCheck, QrCode, ShieldCheck, ShoppingBag, Store, Truck } from 'lucide-react'
import { AddToCart } from '@/components/shop/add-to-cart'
import { Gallery } from '@/components/shop/gallery'
import { RememberProduct } from '@/features/home/components/recently-viewed'
import { ProductCard, GRID } from '@/components/shop/product-card'
import { getCatalogMeta, getFeaturedSlugs, getProductBySlug, getSettings, listProducts } from '@/lib/catalog'
import { SITE_URL } from '@/lib/env'
import { formatDate, formatVND } from '@/lib/utils'
import '@/components/shop/product-detail-v14.css'

export const revalidate = 300

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await getFeaturedSlugs(48)
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const p = await getProductBySlug(slug)
  if (!p) return {}
  return {
    title: p.seo_title ?? p.name,
    description: p.seo_description ?? p.description.slice(0, 160),
    alternates: { canonical: `/san-pham/${p.slug}` },
    openGraph: { images: p.thumbnail && !p.thumbnail.endsWith('.svg') ? [p.thumbnail] : ['/logo-full.png'] }
  }
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params
  const [p, meta, settings] = await Promise.all([getProductBySlug(slug), getCatalogMeta(), getSettings()])
  if (!p) notFound()
  const type = meta.types.find((t) => t.id === p.type_id)
  const cat = meta.categories.find((c) => c.id === p.category_id)
  const attrs = meta.attributes.filter((a) => a.type_id === p.type_id && a.visible && p.attrs[a.code] !== undefined && p.attrs[a.code] !== '')
  const related = cat ? (await listProducts({ category: cat.slug, limit: 5 })).items.filter((x) => x.id !== p.id).slice(0, 4) : []
  const typeNames = Object.fromEntries(meta.types.map((t) => [t.id, t.name]))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    image: p.thumbnail ? new URL(p.thumbnail, SITE_URL).toString() : undefined,
    description: p.description,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'VND',
      price: p.min_price ?? p.price,
      availability: p.allow_preorder ? 'https://schema.org/PreOrder' : p.stock_total > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/san-pham/${p.slug}`
    }
  }

  const brand = meta.brands.find((b) => b.id === p.brand_id)
  const sale = !!p.compare_at_price && p.compare_at_price > p.price
  const facts = attrs.slice(0, 4)
  const attrValues = new Set(attrs.map((a) => String(p.attrs[a.code]).toLowerCase()))
  // Type, category and brand are skipped when an attribute already states the same value (e.g. Game: Pokémon TCG).
  const derived = ([['Nhóm hàng', type?.name], ['Danh mục', cat?.name], ['Thương hiệu', brand?.name]] as [string, string | undefined][])
    .filter((row): row is [string, string] => !!row[1] && !attrValues.has(row[1].toLowerCase()))
  const specs: [string, string][] = [
    ['Mã sản phẩm (SKU)', p.sku],
    ...derived,
    ...attrs.map((a) => [a.name, String(p.attrs[a.code])] as [string, string]),
    ...(p.weight_g ? [['Khối lượng', `${p.weight_g.toLocaleString('vi-VN')} g`] as [string, string]] : []),
    ...(p.allow_preorder && p.preorder_release_date ? [['Dự kiến phát hành', formatDate(p.preorder_release_date)] as [string, string]] : []),
    ...(p.allow_preorder && p.preorder_closes_at ? [['Nhận đặt trước đến', formatDate(p.preorder_closes_at)] as [string, string]] : []),
    ...(p.purchase_limit ? [['Giới hạn mỗi đơn', `${p.purchase_limit} sản phẩm`] as [string, string]] : [])
  ]
  const paragraphs = p.description.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
  const { shipping, rules } = settings
  const services = [
    { icon: ShieldCheck, title: 'Chính hãng 100%', text: 'Kiểm tra kỹ tình trạng trước khi giao.' },
    { icon: Truck, title: 'Giao toàn quốc', text: `TP.HCM ${formatVND(shipping.hcm)} · tỉnh khác ${formatVND(shipping.other)}${shipping.free_over ? ` · miễn phí từ ${formatVND(shipping.free_over)}` : ''}.` },
    { icon: Store, title: 'Nhận tại cửa hàng', text: `${shipping.pickup ? formatVND(shipping.pickup) : 'Miễn phí'}${shipping.pickup_hold_days ? ` · giữ hàng ${shipping.pickup_hold_days} ngày` : ''}.` },
    { icon: QrCode, title: 'Chuyển khoản VietQR', text: `Theo mã đơn; đơn tự hủy nếu chưa chuyển sau ${rules.unpaid_cancel_hours} giờ.` }
  ]
  const steps = [
    { icon: ShoppingBag, title: 'Đặt hàng', text: p.allow_preorder ? 'Chọn số lượng và đặt trước; hàng đặt trước được tạo đơn riêng.' : 'Thêm vào giỏ hoặc bấm Mua ngay, điền thông tin nhận hàng.' },
    { icon: QrCode, title: 'Chuyển khoản', text: `Quét mã VietQR với đúng mã đơn. Đơn chưa thanh toán tự hủy sau ${rules.unpaid_cancel_hours} giờ.` },
    { icon: PackageCheck, title: 'Nhận hàng', text: 'Đóng gói chống sốc, giao toàn quốc hoặc nhận tại cửa hàng.' }
  ]

  return (
    <div className="shop-container shop-page pd-page !pb-20">
      <RememberProduct product={{ id: p.id, slug: p.slug, name: p.name, thumbnail: p.thumbnail, price: p.price, min_price: p.min_price, max_price: p.max_price }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav className="pd-breadcrumb" aria-label="Đường dẫn">
        <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span>
        <Link href="/san-pham">Sản phẩm</Link><span aria-hidden="true">/</span>
        {cat ? (<><Link href={`/danh-muc/${cat.slug}`}>{cat.name}</Link><span aria-hidden="true">/</span></>) : null}
        <span aria-current="page">{p.name}</span>
      </nav>

      <div className="pd-hero">
        <div className="pd-media"><Gallery images={p.images} name={p.name} /></div>
        <div className="pd-info">
          <div className="pd-tags">
            {type ? <Link prefetch={false} href={`/san-pham?type=${encodeURIComponent(type.code)}`} className="pd-tag">{type.name}</Link> : null}
            {cat ? <Link prefetch={false} href={`/danh-muc/${cat.slug}`} className="pd-tag pd-tag-soft">{cat.name}</Link> : null}
            {p.allow_preorder && p.preorder_release_date ? <span className="pd-tag pd-tag-brand"><CalendarClock size={13} aria-hidden="true" />Dự kiến về {formatDate(p.preorder_release_date)}</span> : null}
            {sale ? <span className="pd-tag pd-tag-sale">Ưu đãi</span> : null}
          </div>
          <h1 className="pd-title">{p.name.split(/(\s+)/).map((part, i) => part.includes('-') ? <span key={i} className="pd-nowrap">{part}</span> : part)}</h1>
          <p className="pd-sub">
            <span>SKU <code>{p.sku}</code></span>
            {brand ? <span>{brand.name}</span> : null}
          </p>
          {facts.length ? <dl className="pd-facts">{facts.map((a) => <div key={a.id}><dt>{a.name}</dt><dd>{String(p.attrs[a.code])}</dd></div>)}</dl> : null}
          <AddToCart
            product={p}
            variants={p.variants}
            options={p.options}
            isUnique={!!type?.is_unique}
            trackInventory={type?.track_inventory ?? true}
            depositPct={p.preorder_deposit_pct ?? settings.rules.preorder_deposit_pct}
          />
          <ul className="pd-services">
            {services.map((item) => <li key={item.title}><span className="pd-service-icon" aria-hidden="true"><item.icon size={18} strokeWidth={1.7} /></span><span><b>{item.title}</b><small>{item.text}</small></span></li>)}
          </ul>
        </div>
      </div>

      <nav className="pd-jump" aria-label="Nội dung sản phẩm">
        <a href="#mo-ta">Mô tả</a><a href="#thong-so">Thông số</a><a href="#mua-hang">Mua hàng & giao nhận</a>
      </nav>

      <div className="pd-details">
        <section id="mo-ta" className="pd-card pd-story" aria-labelledby="pd-story-title">
          <span className="pd-eyebrow">Câu chuyện sản phẩm</span>
          <h2 id="pd-story-title">Về {p.name}</h2>
          {paragraphs.length ? paragraphs.map((text, i) => <p key={i}>{text}</p>) : <p>Thông tin chi tiết đang được cập nhật.</p>}
          {p.tags.length ? <ul className="pd-keywords" aria-label="Từ khóa">{p.tags.slice(0, 12).map((tag) => <li key={tag}><Link prefetch={false} href={`/san-pham?q=${encodeURIComponent(tag)}`}>#{tag}</Link></li>)}</ul> : null}
        </section>
        <section id="thong-so" className="pd-card pd-specs" aria-labelledby="pd-specs-title">
          <h2 id="pd-specs-title"><BadgeCheck size={18} aria-hidden="true" />Thông số</h2>
          <dl>{specs.map(([label, value], i) => <div key={`${i}:${label}`}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </section>
      </div>

      <section id="mua-hang" className="pd-flow" aria-labelledby="pd-flow-title">
        <h2 id="pd-flow-title">Mua hàng tại Dark Poke</h2>
        <ol>{steps.map((step, i) => <li key={step.title}><span className="pd-step-index">{i + 1}</span><step.icon size={20} strokeWidth={1.7} aria-hidden="true" /><b>{step.title}</b><p>{step.text}</p></li>)}</ol>
      </section>

      {related.length ? (
        <section className="pd-related" aria-labelledby="pd-related-title">
          <div className="pd-related-head"><div><span className="pd-eyebrow">Tiếp tục khám phá</span><h2 id="pd-related-title">Mảnh ghép tiếp theo</h2></div>{cat ? <Link href={`/danh-muc/${cat.slug}`} className="pd-more">Xem thêm {cat.name}</Link> : <Link href="/san-pham" className="pd-more">Xem tất cả</Link>}</div>
          <div className={GRID}>{related.map((r) => <ProductCard key={r.id} p={r} typeName={typeNames[r.type_id]} />)}</div>
        </section>
      ) : null}
    </div>
  )
}
