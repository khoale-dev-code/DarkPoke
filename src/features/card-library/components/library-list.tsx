import Link from 'next/link'
import { ArrowUpRight, BadgeDollarSign, BookOpen, Layers, WifiOff } from 'lucide-react'
import { getLibraryPage, getLibrarySets } from '../server/data'
import { LANGUAGES, libraryParams, type LibraryQuery } from '../domain'
import { LibraryCardGrid } from './card-grid'
import { LibraryFilters } from './filters'
import { RefreshLibrary } from './refresh-button'
import '../library.css'

export async function LibraryList({ query }: { query: LibraryQuery }) {
  const [pageResult, setsResult] = await Promise.allSettled([getLibraryPage(query), getLibrarySets(query.lang)])
  const page = pageResult.status === 'fulfilled' ? pageResult.value : null
  const sets = setsResult.status === 'fulfilled' ? setsResult.value : []
  const names = Object.fromEntries(sets.map(set => [set.id, set.name]))
  const series = Object.fromEntries(sets.flatMap(set => set.serie ? [[set.id, set.serie]] : []))
  const queryKey = libraryParams(query).toString()

  return <div className="shop-container dex-page dex-library" id="dex-library-top">
    <LibraryFilters key={`dex-filters:${queryKey}`} query={query} sets={sets} setsAvailable={setsResult.status === 'fulfilled'}
      intro={<div className="dxl-copy"><span className="dxl-eyebrow">Thư viện thẻ · Dữ liệu TCGdex</span><h1 id="dxl-title">Thư viện thẻ <span className="dxl-holo">Pokémon</span></h1><p>Tra cứu hình ảnh, chiêu thức và giá thị trường TCGplayer, Cardmarket của từng lá bài, trước khi bạn mua, bán hay trao đổi.</p></div>}
      aside={<ul className="dxl-meta"><li><BookOpen size={15} aria-hidden="true"/>{LANGUAGES.length} ngôn ngữ in thẻ</li><li><BadgeDollarSign size={15} aria-hidden="true"/>Giá TCGplayer & Cardmarket, đổi sang VND</li><li><Layers size={15} aria-hidden="true"/>Lọc theo bộ thẻ</li></ul>}/>
    {page ? <LibraryCardGrid key={`dex-grid:${queryKey}`} query={query} initial={page} typeNames={names} series={series}/>
      : <section className="dex-empty dex-connection-error" role="status"><span><WifiOff size={28} strokeWidth={1.5} aria-hidden="true"/></span><h2>Chưa kết nối được thư viện thẻ</h2><p>TCGdex có thể đang phản hồi chậm. Bạn có thể thử lại sau ít phút hoặc tiếp tục xem sản phẩm của shop.</p><div><RefreshLibrary/><Link href="/san-pham" className="btn btn-ghost">Xem sản phẩm</Link></div></section>}

    <footer className="dex-attribution"><span>Thông tin và hình ảnh từ TCGdex. Nội dung thẻ giữ nguyên ngôn ngữ nguồn.</span><a href="https://www.tcgdex.net" target="_blank" rel="noopener noreferrer">Khám phá TCGdex<ArrowUpRight size={13} aria-hidden="true"/></a></footer>
  </div>
}
