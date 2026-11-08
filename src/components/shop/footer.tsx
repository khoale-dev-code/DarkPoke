import Link from 'next/link'
import { ArrowUpRight, Landmark, Mail, MapPin, MessageCircle, PackageCheck, Phone, ShieldCheck, Truck, type LucideIcon } from 'lucide-react'
import { ShopBrand } from '@/components/shop/brand'
import { FooterMap } from '@/components/shop/footer-map'
import { isPlaceholder } from '@/lib/utils'
import type { Category, ShopSettings } from '@/lib/types'
import './footer-v14.css'

interface FooterLink { href: string; label: string }
interface Contact { key: string; icon: LucideIcon; label: string; value: string; href?: string; external?: boolean }

// V14.37: the front of the sea is a row of breaking waves in Japanese print style (repeating tile in footer-v14.css),
// with foam claws above each lip; the two swells behind it give depth.
// V14.36: three layered swells (back, middle, the sea itself), smooth curves generated from two summed sine waves.
const BACK_WAVE = 'M0 135 L0 29.9 C10 27 20 25 30 24 C40 22 50 21 60 20 C70 20 80 19 90 19 C100 19 110 19 120 19 C130 19 140 19 150 19 C160 19 170 19 180 20 C190 20 200 20 210 21 C220 22 230 23 240 24 C250 26 260 28 270 30 C280 32 290 35 300 38 C310 41 320 44 330 47 C340 51 350 54 360 57 C370 60 380 63 390 65 C400 67 410 69 420 70 C430 71 440 71 450 70 C460 70 470 68 480 67 C490 65 500 62 510 60 C520 57 530 54 540 51 C550 48 560 45 570 43 C580 40 590 38 600 36 C610 34 620 32 630 31 C640 29 650 28 660 27 C670 25 680 25 690 24 C700 23 710 22 720 21 C730 20 740 19 750 18 C760 17 770 16 780 16 C790 16 800 16 810 16 C820 16 830 17 840 19 C850 20 860 22 870 25 C880 27 890 30 900 34 C910 37 920 41 930 44 C940 48 950 52 960 55 C970 58 980 61 990 63 C1000 66 1010 67 1020 68 C1030 69 1040 69 1050 69 C1060 68 1070 67 1080 66 C1090 64 1100 62 1110 60 C1120 59 1130 56 1140 54 C1150 52 1160 50 1170 48 C1180 46 1190 44 1200 43 C1210 41 1220 39 1230 38 C1240 36 1250 35 1260 33 C1270 31 1280 30 1290 28 C1300 26 1310 24 1320 22 C1330 21 1340 19 1350 17 C1360 16 1370 14 1380 13 C1390 12 1400 12 1410 12 C1420 12 1430 13 1440 14 L1440 135Z'
const MID_WAVE = 'M0 135 L0 43.9 C10 45 20 46 30 48 C40 50 50 53 60 56 C70 60 80 64 90 69 C100 73 110 78 120 82 C130 86 140 90 150 93 C160 95 170 97 180 98 C190 99 200 99 210 98 C220 97 230 95 240 93 C250 91 260 89 270 86 C280 84 290 81 300 79 C310 77 320 74 330 72 C340 70 350 69 360 67 C370 64 380 62 390 60 C400 58 410 55 420 53 C430 50 440 47 450 45 C460 42 470 40 480 39 C490 37 500 36 510 37 C520 37 530 38 540 41 C550 43 560 46 570 50 C580 54 590 59 600 63 C610 67 620 72 630 75 C640 79 650 83 660 85 C670 88 680 89 690 90 C700 92 710 92 720 92 C730 92 740 92 750 92 C760 91 770 91 780 90 C790 90 800 89 810 88 C820 87 830 87 840 85 C850 84 860 82 870 79 C880 77 890 73 900 70 C910 66 920 62 930 58 C940 54 950 50 960 46 C970 43 980 40 990 38 C1000 36 1010 35 1020 35 C1030 35 1040 37 1050 39 C1060 41 1070 44 1080 47 C1090 50 1100 54 1110 57 C1120 60 1130 63 1140 66 C1150 69 1160 71 1170 73 C1180 75 1190 77 1200 79 C1210 81 1220 82 1230 84 C1240 85 1250 87 1260 89 C1270 90 1280 92 1290 94 C1300 95 1310 96 1320 96 C1330 97 1340 96 1350 95 C1360 94 1370 91 1380 88 C1390 85 1400 81 1410 77 C1420 73 1430 68 1440 64 L1440 135Z'

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
      <svg className="dpf-tide-back" viewBox="0 0 1440 135" preserveAspectRatio="none" focusable="false"><path d={BACK_WAVE} /></svg>
      <svg className="dpf-tide-mid" viewBox="0 0 1440 135" preserveAspectRatio="none" focusable="false"><path d={MID_WAVE} /></svg>
      <span className="dpf-tide-foam" />
    </div>
    </div>

    <div className="dpf-sea">
    <div className="shop-container dpf-main">
      <div className="dpf-left">
      <nav className="dpf-links" aria-label="Liên kết chân trang">
        {sections.map((section, index) => <section key={section.title} aria-labelledby={`dpf-s${index}`}>
          <h3 id={`dpf-s${index}`}>{section.title}</h3>
          <ul>{section.links.map((link) => <li key={link.href}><Link prefetch={false} href={link.href}>{link.label}</Link></li>)}</ul>
        </section>)}
      </nav>
      {contactList.length ? <ul className="dpf-contacts" aria-label="Liên hệ">{contactList.map((item) => <ContactRow key={item.key} item={item} />)}</ul> : null}
      </div>

      <aside className="dpf-panel" aria-labelledby="dpf-contact-title">
        <div className="dpf-panel-head">
          <h3 id="dpf-contact-title">Ghé cửa hàng</h3>
          <a className="dpf-directions" href={MAP_LINK} target="_blank" rel="noopener noreferrer">Chỉ đường<ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
        <FooterMap src={MAP_EMBED} title="Bản đồ cửa hàng Dark Poke - Pokemon Trading Card Store" />
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
