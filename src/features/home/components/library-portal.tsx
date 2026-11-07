import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Search, Sparkles } from 'lucide-react'
import { libraryHref, parseLibraryQuery } from '@/features/card-library/domain'
import '../library-portal.css'

const SUGGESTIONS = ['Pikachu', 'Charizard', 'Eevee'] as const

export function HomeLibraryPortal() {
  return <section className="library-portal" data-library-portal aria-labelledby="home-atlas-title">
    <div className="library-portal-shell">
      <div className="library-portal-eyebrow">
        <span><span className="library-portal-dot" aria-hidden="true"/>Thư viện thẻ Pokémon</span>
        <span className="library-portal-source">Dữ liệu từ TCGdex<ArrowUpRight size={14} aria-hidden="true"/></span>
      </div>

      <div className="library-portal-intro">
        <h2 id="home-atlas-title"><span>Tìm thẻ.</span><span>Chạm đam mê.</span></h2>
        <div className="library-portal-invite">
          <p>Từ Pokémon bạn thích đến chiếc thẻ chưa từng biết. Tìm theo tên, mã thẻ hoặc khám phá từng bộ sưu tập.</p>
          <Link prefetch={false} href="/thu-vien-the" className="library-portal-cta">
            <span>Vào thư viện thẻ</span><span className="library-portal-cta-icon"><ArrowUpRight size={23} aria-hidden="true"/></span>
          </Link>
        </div>
      </div>

      <div className="library-portal-scene">
        <div className="library-portal-sleeve" data-library-art>
          <div className="library-portal-picture">
            <Image src="/home-v7/moon-festival.webp" alt="Lugia bay dưới trăng, Gengar, Umbreon và các Pokémon tụ hội giữa lễ hội đèn lồng rực rỡ" fill sizes="(min-width: 1600px) 1440px, 92vw" className="library-portal-image"/>
          </div>
        </div>
        <span className="library-portal-sticker" aria-hidden="true"><Sparkles size={22}/><span>Gặp lại Pokémon<br/>bạn yêu thích.</span></span>
        <svg className="library-portal-orbit" data-library-orbit viewBox="0 0 200 200" aria-hidden="true" focusable="false">
          <path d="M100 13 118 72 177 50 144 102 188 143 129 136 112 191 88 137 29 163 61 110 13 68 75 75Z" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".22"/>
          <path data-library-path d="M100 13 118 72 177 50 144 102 188 143 129 136 112 191 88 137 29 163 61 110 13 68 75 75Z" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle data-library-marker cx="100" cy="13" r="4" fill="currentColor"/>
          <path d="M90 100h20m-10-10v20" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>

      <div className="library-portal-bottom">
        <p><Search size={17} aria-hidden="true"/>Bắt đầu từ Pokémon bạn thích</p>
        <nav className="library-portal-suggestions" aria-label="Tra nhanh thẻ Pokémon">
          {SUGGESTIONS.map(name => <Link key={name} prefetch={false} href={libraryHref(parseLibraryQuery({ q: name }))}>
            {name}<ArrowUpRight size={16} aria-hidden="true"/>
          </Link>)}
        </nav>
      </div>
    </div>
  </section>
}
