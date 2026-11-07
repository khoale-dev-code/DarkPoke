import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

export function HomeCollectionStudio({ href }: { href: string }) {
  return <section className="shop-container home-section">
    <div className="collector-studio">
      <div className="collector-studio-copy" data-home-reveal>
        <span className="studio-kicker">Dành riêng cho người sưu tầm</span>
        <h2><span>Giữ lại</span><span>điều bạn</span><span>say mê.</span></h2>
        <p>Từ chiếc thẻ đầu tiên đến bộ sưu tập bạn tự hào. Bảo vệ kỹ, trưng bày đẹp và dành cho chúng một góc thật riêng.</p>
        <Link href={href} className="studio-action">Chăm chút bộ sưu tập<ArrowUpRight size={20} aria-hidden="true"/></Link>
      </div>
      <figure className="collector-studio-photo">
        <div className="collector-studio-image" data-home-parallax>
          <Image src="/home-v13/collection.webp" alt="Bộ sưu tập thẻ Pokémon trong các khung acrylic đặt trên bàn gỗ" fill sizes="(max-width: 899px) 100vw, 65vw"/>
        </div>
        <figcaption>Góc trưng bày của người sưu tầm<span aria-hidden="true">HUNT · TRADE · COLLECT</span></figcaption>
      </figure>
    </div>
  </section>
}

export function HomeTradeStudio({ quoteHours }: { quoteHours: number }) {
  return <section className="shop-container home-section">
    <div className="trade-studio">
      <div className="trade-studio-copy" data-home-reveal>
        <span className="studio-kicker">Thu mua &amp; trao đổi</span>
        <h2>Thẻ của bạn.<br/><span>Hành trình mới.</span></h2>
        <p>Gửi danh sách, tình trạng và hình ảnh vật phẩm. Dark Poke sẽ liên hệ báo giá trong {quoteHours} giờ.</p>
        <Link href="/thu-mua" className="studio-action">Gửi yêu cầu thu mua<ArrowRight size={20} aria-hidden="true"/></Link>
        <ol className="trade-studio-steps" aria-label="Quy trình thu mua">
          <li><span>01</span>Gửi thông tin</li><li><span>02</span>Shop kiểm tra</li><li><span>03</span>Nhận báo giá</li>
        </ol>
        <small>Giá cuối cùng được xác nhận sau khi kiểm tra vật phẩm.</small>
      </div>
      <figure className="trade-studio-poster">
        <Image src="/home-v13/tcg-news.webp" alt="Poster cảm hứng Pokémon TCG với bộ sưu tập Generations và các gói thẻ bài" width={1536} height={1024} sizes="(max-width: 899px) 100vw, 50vw"/>
        <figcaption>Ảnh cảm hứng · Pokémon TCG</figcaption>
      </figure>
    </div>
  </section>
}
