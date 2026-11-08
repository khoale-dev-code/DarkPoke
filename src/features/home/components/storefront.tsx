import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { HomeData } from '../server/data'
import { HomeMotionShell } from './motion-shell'
import { HomeHeroCarousel } from './hero-carousel'
import { ProductRail } from './product-rail'
import { RecentlyViewed } from './recently-viewed'
import '../home.css'
import '../home-v14.css'


const pad = (value: number) => String(value).padStart(2, '0')

interface Story { key: string; eyebrow: string; title: string; text: string; href: string; image: string; alt: string; action: string; position?: string }

/** Editorial tiles: artwork shipped with V6–V13 (public/home-v6, v7, v13) plus the V14.17 Explore images in public/home-v14. */
function stories(data: HomeData): Story[] {
  const { modules } = data.settings
  const list: (Story | false)[] = [
    { key: 'library', eyebrow: 'Thư viện thẻ · TCGdex', title: 'Tra cứu mọi lá bài Pokémon', text: 'Tên, mã thẻ, bộ thẻ và hình ảnh chi tiết.', href: '/thu-vien-the', image: '/home-v7/moon-festival.webp', alt: 'Lugia bay dưới trăng giữa lễ hội đèn lồng Pokémon', action: 'Mở thư viện' },
    modules.preorder && { key: 'preorder', eyebrow: 'Pre-order', title: 'Giữ suất cho bộ thẻ sắp phát hành', text: 'Đặt cọc theo từng sản phẩm, trả phần còn lại khi hàng về.', href: '/pre-order', image: '/home-v6/sky-world.webp', alt: 'Charizard bay giữa mây và biển trong tranh màu nước', action: 'Xem pre-order', position: '50% 35%' },
    { key: 'grading', eyebrow: 'Thẻ grading', title: 'Những lá bài đã được chấm điểm', text: 'PSA, BGS, CGC với số cert rõ ràng.', href: '/san-pham?type=the-grading', image: '/home-v14/explore-grading.webp', alt: 'Ba lá bài Pokémon Brambleghast, Honchkrow và Moltres trên nền tối có vòng sáng xanh', action: 'Khám phá grading' },
    { key: 'collection', eyebrow: 'Phụ kiện', title: 'Bảo vệ và trưng bày bộ sưu tập', text: 'Sleeves, binder, hộp đựng cho từng lá bài.', href: data.accessoriesHref, image: '/home-v13/collection.webp', alt: 'Thẻ Pokémon trong khung acrylic trên bàn gỗ', action: 'Chọn phụ kiện' },
    modules.tradein && { key: 'tradein', eyebrow: 'Thu mua & trao đổi', title: 'Thẻ của bạn, hành trình mới', text: `Gửi ảnh và tình trạng, nhận báo giá trong ${data.settings.rules.tradein_quote_hours} giờ.`, href: '/thu-mua', image: '/home-v14/explore-tradein.webp', alt: 'Các lá bài Pikachu bộ 30th Celebration bay trên nền vàng', action: 'Gửi yêu cầu' },
    { key: 'sealed', eyebrow: 'Sealed', title: 'Hồi hộp từ lần mở đầu tiên', text: 'Booster box, ETB, pack và tin còn nguyên seal.', href: '/san-pham?type=sealed', image: '/home-v14/explore-sealed.webp', alt: 'Logo Pokémon TCG 30th Celebration, đã có hàng', action: 'Xem sealed' }
  ]
  return list.filter((story): story is Story => !!story)
}

export function HomeStorefront({ data }: { data: HomeData }) {
  const { settings, products, latest, preorders, typeNames } = data
  const tiles = stories(data)
  // V14.16 Explore: the first story becomes the key art of a dark stage, the rest are dealt as a fan of cards across its edge.
  const [lead, ...deck] = tiles

  return <HomeMotionShell>
    <HomeHeroCarousel />

    {/* V14.35: the intro and quick-link block under the banner was removed; the page keeps its h1 for search engines and screen readers. */}
    <h1 id="home-title" className="sr-only">Thẻ bài chính hãng cho người sưu tầm</h1>

    <ProductRail id="hp-best" eyebrow="Được chọn cho bạn" title="Bán chạy tại Dark Poke" href="/san-pham" items={products} typeNames={typeNames} />

    {lead ? <section className="hp-explore hx" aria-labelledby="hp-stories-title">
      <div className="hx-stage">
        <div className="hx-key" aria-hidden="true">
          <Image src={lead.image} alt="" fill sizes="(max-width: 899px) 100vw, 70vw" className="hx-key-img" style={lead.position ? { objectPosition: lead.position } : undefined} />
        </div>
        <div className="hx-sky" aria-hidden="true"><i /><i /><i /></div>
        <div className="shop-container hx-stage-inner">
          <header className="hx-head" data-home-reveal>
            <span className="hx-eyebrow">Khám phá · {pad(tiles.length)} lối vào</span>
            <h2 id="hp-stories-title">Mọi thứ cho hành trình sưu tầm</h2>
            <p>Từ tra cứu một lá bài tới giữ suất bộ thẻ sắp phát hành. Chọn lối vào phù hợp với bạn.</p>
          </header>
          <Link prefetch={false} href={lead.href} className="hx-lead" aria-label={`${lead.title}: ${lead.action}`}>
            <span className="hx-lead-tag"><b>01</b>{lead.eyebrow}</span>
            <span className="hx-lead-title">{lead.title}</span>
            <span className="hx-lead-text">{lead.text}</span>
            <span className="hx-lead-cta">{lead.action}<ArrowUpRight size={16} aria-hidden="true" /></span>
          </Link>
        </div>
      </div>
      {deck.length ? <div className="hx-deck-wrap">
        <ul className="hx-deck" data-count={deck.length} aria-label="Các lối vào khác">
          {deck.map((story, index) => {
            const offset = index - (deck.length - 1) / 2
            return <li key={story.key} style={{ '--o': offset, '--oa': Math.abs(offset) } as CSSProperties}>
              <Link prefetch={false} href={story.href} className="hx-card">
                <span className="hx-card-bar"><span>{story.eyebrow}</span><b>{pad(index + 2)}/{pad(tiles.length)}</b></span>
                <span className="hx-card-art">
                  <Image src={story.image} alt={story.alt} fill sizes="(max-width: 1099px) 62vw, 250px" className="hx-card-img" style={story.position ? { objectPosition: story.position } : undefined} />
                </span>
                <span className="hx-card-title">{story.title}</span>
                <span className="hx-card-text">{story.text}</span>
                <span className="hx-card-foot"><span>{story.action}</span><span className="hx-card-arrow" aria-hidden="true"><ArrowUpRight size={16} strokeWidth={2} /></span></span>
              </Link>
            </li>
          })}
        </ul>
      </div> : null}
    </section> : null}

    {settings.modules.preorder ? <ProductRail id="hp-preorder" eyebrow="Sắp phát hành" title="Đặt trước bộ thẻ mới" href="/pre-order" action="Xem tất cả pre-order" items={preorders} typeNames={typeNames} variant="feature" /> : null}

    <ProductRail id="hp-latest" eyebrow="Mới về kho" title="Vừa có mặt tại Dark Poke" href="/san-pham?sort=new" action="Xem sản phẩm mới" items={latest} typeNames={typeNames} tone={settings.modules.preorder && preorders.length ? 'tint' : 'plain'} />

    <RecentlyViewed />
  </HomeMotionShell>
}
