import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowUpRight, Landmark, Mail, MapPin, MessageCircle, PackageCheck, Phone, ShieldCheck, Truck, type LucideIcon } from 'lucide-react'
import { ShopBrand } from '@/components/shop/brand'
import { FooterMap } from '@/components/shop/footer-map'
import { isPlaceholder } from '@/lib/utils'
import type { Category, ShopSettings } from '@/lib/types'
import './footer-v14.css'

interface FooterLink { href: string; label: string }
interface Contact { key: string; icon: LucideIcon; label: string; value: string; href?: string; external?: boolean }

// Bubbles above the liquid edge: x position, height as a share of the wave, diameter in px, float (animated) or attached.
const BUBBLES: { x: string; y: number; s: number; float?: boolean; wide?: boolean }[] = [
  { x: '7%', y: .5, s: 12 }, { x: '18%', y: 1.05, s: 8, float: true, wide: true }, { x: '28.5%', y: .66, s: 22 },
  { x: '44%', y: 1.1, s: 9, float: true }, { x: '60.5%', y: .8, s: 24 }, { x: '71%', y: 1.15, s: 8, float: true, wide: true },
  { x: '84.5%', y: .56, s: 16 }, { x: '93%', y: 1.05, s: 9, float: true },
]
const BACK_WAVE = 'M0 200 L0 42 C15 40 62 27 90 28 C118 29 143 47 170 48 C197 49 223 39 250 34 C277 28 302 13 330 16 C358 19 388 44 420 51 C452 58 487 64 520 60 C553 56 590 36 620 28 C650 20 672 8 700 10 C728 12 760 33 790 39 C820 46 848 48 880 51 C912 54 948 64 980 60 C1012 56 1042 36 1070 28 C1098 19 1123 7 1150 7 C1177 8 1202 29 1230 31 C1258 33 1285 18 1320 19 C1355 20 1420 34 1440 36 L1440 200Z'

// Google Maps embed and place link for the Dark Poke store.
const MAP_EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5902363333253!2d106.65774097480485!3d10.7660297893822!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f006fde92f7%3A0xa60cd23fa3b1dad6!2sDARK%20POKE%20-%20Pokemon%20Trading%20Card%20Store!5e0!3m2!1sen!2s!4v1793965907259!5m2!1sen!2s'
const MAP_LINK = 'https://www.google.com/maps?cid=11965169480787679958'

const TRUST = [
  { icon: ShieldCheck, title: 'Hàng chính hãng', text: 'Chọn kỹ cho người sưu tầm' },
  { icon: Truck, title: 'Giao toàn quốc', text: 'Hoặc nhận tại cửa hàng' },
  { icon: PackageCheck, title: 'Đóng gói cẩn thận', text: 'Chống sốc cho từng đơn' },
  { icon: Landmark, title: 'Thanh toán VietQR', text: 'Chuyển khoản theo mã đơn' }
]

function contacts(shop: ShopSettings['shop']): Contact[] {
  const valid = (value: string) => !!value && !isPlaceholder(value)
  const list: Contact[] = []
  if (valid(shop.hotline)) list.push({ key: 'hotline', icon: Phone, label: 'Hotline', value: shop.hotline, href: `tel:${shop.hotline.replace(/[^+0-9]/g, '')}` })
  if (valid(shop.zalo)) {
    const digits = shop.zalo.replace(/\D/g, '')
    list.push({ key: 'zalo', icon: MessageCircle, label: 'Zalo', value: shop.zalo, href: digits.length >= 9 ? `https://zalo.me/${digits}` : undefined, external: true })
  }
  if (valid(shop.email)) list.push({ key: 'email', icon: Mail, label: 'Email', value: shop.email, href: `mailto:${shop.email}` })
  if (valid(shop.address)) list.push({ key: 'address', icon: MapPin, label: 'Cửa hàng', value: shop.address, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`, external: true })
  return list
}

function ContactRow({ item }: { item: Contact }) {
  const body = <>
    <span className="dpf-contact-icon" aria-hidden="true"><item.icon size={17} strokeWidth={1.7} /></span>
    <span className="dpf-contact-text"><small>{item.label}</small><span>{item.value}</span></span>
  </>
  if (!item.href) return <li><div className="dpf-contact">{body}</div></li>
  return <li><a className="dpf-contact" href={item.href} {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{body}</a></li>
}

export function SiteFooter({ settings, categories }: { settings: ShopSettings; categories: Category[] }) {
  const { shop, modules } = settings
  const roots = categories.filter((category) => !category.parent_id && category.visible).slice(0, 5)
  const sections: { title: string; links: FooterLink[] }[] = [
    {
      title: 'Mua sắm',
      links: [
        { href: '/san-pham', label: 'Tất cả sản phẩm' },
        ...roots.map((category) => ({ href: `/danh-muc/${category.slug}`, label: category.name })),
        { href: '/san-pham?sort=new', label: 'Hàng mới về' },
        ...(modules.preorder ? [{ href: '/pre-order', label: 'Sản phẩm đặt trước' }] : [])
      ]
    },
    {
      title: 'Dịch vụ',
      links: [
        { href: '/thu-vien-the', label: 'Thư viện thẻ Pokémon' },
        ...(modules.tradein ? [{ href: '/thu-mua', label: 'Thu mua & trao đổi' }] : []),
        { href: '/san-pham?type=the-grading', label: 'Thẻ đã grading' },
        { href: '/san-pham?type=phu-kien', label: 'Phụ kiện bảo quản' }
      ]
    },
    {
      title: 'Tài khoản',
      links: [
        { href: '/tai-khoan', label: 'Theo dõi đơn hàng' },
        { href: '/gio-hang', label: 'Giỏ hàng của bạn' },
        { href: '/dang-nhap', label: 'Đăng nhập' }
      ]
    }
  ]
  const contactList = contacts(shop)
  const year = new Date().getFullYear()

  return <footer className="dpf" aria-labelledby="dpf-title">
    <h2 id="dpf-title" className="sr-only">Thông tin Dark Poke</h2>

    <div className="dpf-deep">
    <div className="shop-container dpf-top">
      <div className="dpf-brand">
        <ShopBrand />
        <p>Không chỉ là thẻ bài. Là những câu chuyện, những lần mở pack và bộ sưu tập mang dấu ấn của bạn.</p>
      </div>
      <ul className="dpf-trust" aria-label="Cam kết của cửa hàng">
        {TRUST.map((item) => <li key={item.title}>
          <span className="dpf-trust-icon" aria-hidden="true"><item.icon size={18} strokeWidth={1.8} /></span>
          <span><b>{item.title}</b><small>{item.text}</small></span>
        </li>)}
      </ul>
    </div>
    <div className="dpf-tide" aria-hidden="true">
      <svg className="dpf-tide-back" viewBox="0 0 1440 90" preserveAspectRatio="none" focusable="false"><path d={BACK_WAVE} /></svg>
      {BUBBLES.map((b, i) => <i key={i} data-float={b.float ? '' : undefined} data-wide={b.wide ? '' : undefined}
        style={{ left: b.x, '--y': b.y, '--s': b.s, '--d': `${4 + (i % 4) * 1.3}s`, '--delay': `${-(i % 5) * .9}s` } as CSSProperties} />)}
    </div>
    </div>

    <div className="dpf-sea">
    <div className="shop-container dpf-main">
      <nav className="dpf-links" aria-label="Liên kết chân trang">
        {sections.map((section, index) => <section key={section.title} aria-labelledby={`dpf-s${index}`}>
          <h3 id={`dpf-s${index}`}>{section.title}</h3>
          <ul>{section.links.map((link) => <li key={link.href}><Link prefetch={false} href={link.href}>{link.label}</Link></li>)}</ul>
        </section>)}
      </nav>

      <aside className="dpf-panel" aria-labelledby="dpf-contact-title">
        <div className="dpf-panel-head">
          <h3 id="dpf-contact-title">Ghé cửa hàng</h3>
          <a className="dpf-directions" href={MAP_LINK} target="_blank" rel="noopener noreferrer">Chỉ đường<ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
        <FooterMap src={MAP_EMBED} title="Bản đồ cửa hàng Dark Poke - Pokemon Trading Card Store" />
        {contactList.length ? <ul className="dpf-contacts">{contactList.map((item) => <ContactRow key={item.key} item={item} />)}</ul> : null}
      </aside>
    </div>
    </div>

    <div className="dpf-legal">
      <div className="shop-container dpf-legal-inner">
        <p>© {year} {shop.name}</p>
        <p className="dpf-notice">Pokémon, One Piece Card Game và các tên, hình ảnh liên quan thuộc về chủ sở hữu tương ứng. {shop.name} là cửa hàng độc lập, không phải đơn vị phát hành chính thức.</p>
        <Link prefetch={false} href="/san-pham" className="dpf-legal-link">Khám phá cửa hàng<ArrowUpRight size={13} aria-hidden="true" /></Link>
      </div>
    </div>
  </footer>
}
