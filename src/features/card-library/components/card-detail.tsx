import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft, ArrowUpRight, Info, Layers, Search } from 'lucide-react'
import { LANGUAGES, backHref, cardImageCandidates, categoryLabel, libraryHref, parseLibraryQuery, serieFromLogo, typeLabel, type CardLanguage, type LibraryDetail } from '../domain'
import { formatUpdated, variantLabel, type ExchangeRates } from '../pricing'
import { DetailArt } from './detail-art'
import { MarketPanel } from './price-panel'
import { CurrencyProvider } from './currency'
import { ScrydexSection, ScrydexSkeleton } from './scrydex-section'
import '../library.css'
import '../library-v14.css'

const ENERGY: Record<string, string> = { Fire: '#e4572e', Water: '#2f86de', Grass: '#3fa34d', Lightning: '#f2c12e', Electric: '#f2c12e', Psychic: '#9b59b6', Fighting: '#b8692f', Darkness: '#2f3c4f', Metal: '#8d99a6', Fairy: '#e48bb4', Dragon: '#b08a1e', Colorless: '#c9ced6' }

function Energy({ types }: { types: string[] }) {
  return <span className="dx-energy">{types.map((type, index) => <i key={`${type}:${index}`} style={{ background: ENERGY[type] ?? '#c9ced6' }} title={typeLabel(type)} />)}<span className="sr-only">{types.map(typeLabel).join(', ')}</span></span>
}

export function LibraryCardDetail({ card, lang, from, rates }: { card: LibraryDetail; lang: CardLanguage; from?: string; rates: ExchangeRates }) {
  const language = LANGUAGES.find((l) => l.code === lang)?.label
  const setHref = libraryHref({ ...parseLibraryQuery(new URLSearchParams()), lang, set: card.set.id })
  const number = `${card.localId}${card.set.cardCount?.official ? '/' + card.set.cardCount.official : ''}`
  const printed = Object.entries(card.variants ?? {}).filter(([, on]) => on).map(([key]) => variantLabel(key))
  const legal = card.legal ? [card.legal.standard ? 'Standard' : null, card.legal.expanded ? 'Expanded' : null].filter(Boolean).join(' · ') || 'Không hợp lệ ở Standard/Expanded' : null
  const facts: [string, string][] = [
    ['Mã thẻ', card.id], ['Bộ thẻ', card.set.name], ['Số thẻ', number], ['Ngôn ngữ', language ?? lang],
    ['Độ hiếm', card.rarity ?? 'Chưa cập nhật'], ['Họa sĩ', card.illustrator ?? 'Chưa cập nhật']
  ]
  if (card.hp != null) facts.push(['HP', String(card.hp)])
  if (card.stage) facts.push(['Giai đoạn', card.stage])
  if (card.evolveFrom) facts.push(['Tiến hóa từ', card.evolveFrom])
  if (card.trainerType) facts.push(['Loại Trainer', card.trainerType])
  if (card.energyType) facts.push(['Loại năng lượng', card.energyType])
  if (card.suffix) facts.push(['Hậu tố', card.suffix])
  if (card.regulationMark) facts.push(['Dấu điều chỉnh', card.regulationMark])
  if (legal) facts.push(['Thể thức hợp lệ', legal])
  if (card.dexId?.length) facts.push(['Số Pokédex', card.dexId.map((n) => `#${String(n).padStart(4, '0')}`).join(', ')])
  if (printed.length) facts.push(['Phiên bản in', printed.join(' · ')])
  const dataUpdated = formatUpdated(card.updated ?? null)
  const serie = serieFromLogo(card.set.logo, card.set.id)
  const images = (quality: 'low' | 'high') => cardImageCandidates({ primary: quality === 'high' ? card.imageHigh : card.imageLow, localId: card.localId, setId: card.set.id, lang, serie, quality })

  return <CurrencyProvider rates={rates}><div className="shop-container dex-page dx-page">
    <nav className="dex-breadcrumb" aria-label="Đường dẫn"><Link href={backHref(from, lang)}><ArrowLeft size={15} aria-hidden="true" />Thư viện thẻ</Link><span>/</span><Link prefetch={false} href={setHref}>{card.set.name}</Link><span>/</span><span>{card.name}</span></nav>

    <div className="dx-layout">
      <div className="dx-art"><DetailArt candidates={images('high')} zoomCandidates={images('high')} name={card.name} meta={`${card.set.name} · #${number}`} /></div>

      <div className="dx-main">
        <header className="dx-title">
          <span className="dx-eyebrow">Pokémon TCG · {card.category === 'Pokemon' ? 'Thẻ Pokémon' : categoryLabel(card.category)}</span>
          <h1>{card.name}</h1>
          <p>{card.set.name} · #{number}{card.rarity ? ` · ${card.rarity}` : ''}</p>
          <div className="dex-detail-tags">
            <span>{card.id}</span>
            {card.types?.map((type, i) => <span key={`${type}:${i}`} className="dx-type"><i style={{ background: ENERGY[type] ?? '#c9ced6' }} aria-hidden="true" />{typeLabel(type)}</span>)}
            {card.hp != null ? <span>HP {card.hp}</span> : null}
            {card.regulationMark ? <span>Dấu {card.regulationMark}</span> : null}
          </div>
        </header>

        <MarketPanel market={card.market} name={card.name} setName={card.set.name} />

        <div className="dx-actions">
          <Link prefetch={false} href={`/san-pham?q=${encodeURIComponent(card.name)}`} className="btn btn-primary btn-lg"><Search size={17} aria-hidden="true" />Tìm sản phẩm cùng tên tại shop</Link>
          <Link prefetch={false} href={setHref} className="btn btn-secondary btn-lg"><Layers size={17} aria-hidden="true" />Xem cả bộ {card.set.name}</Link>
        </div>
        <p className="dx-disclaimer"><Info size={15} aria-hidden="true" />Giá thị trường quốc tế (TCGplayer: Mỹ, Cardmarket: châu Âu) chỉ để tham khảo, không phải giá bán tại Dark Poke. Giá thực tế phụ thuộc tình trạng thẻ và phí vận chuyển.</p>
      </div>
    </div>

    <Suspense fallback={<ScrydexSkeleton />}>
      <ScrydexSection input={{ name: card.name, localId: card.localId, setName: card.set.name, official: card.set.cardCount?.official }} lang={lang} />
    </Suspense>

    <div className="dx-columns">
      <div className="dx-texts">
        {card.description || card.effect || card.item ? <section className="dx-section"><h2>Nội dung thẻ</h2>
          {card.item ? <p><b>{card.item.name}</b>{card.item.effect ? ` — ${card.item.effect}` : ''}</p> : null}
          {card.effect ? <p>{card.effect}</p> : null}{card.description ? <p className="dx-flavor">{card.description}</p> : null}</section> : null}
        {card.abilities?.length ? <section className="dx-section"><h2>Khả năng</h2><div className="dx-moves">{card.abilities.map((a, i) => <article key={`ability:${i}:${a.name}`}>
          <header>{a.type ? <small>{a.type}</small> : null}<h3>{a.name}</h3></header>{a.effect ? <p>{a.effect}</p> : null}</article>)}</div></section> : null}
        {card.attacks?.length ? <section className="dx-section"><h2>Chiêu thức</h2><div className="dx-moves">{card.attacks.map((a, i) => <article key={`attack:${i}:${a.name}`}>
          <header>{a.cost?.length ? <Energy types={a.cost} /> : null}<h3>{a.name}</h3>{a.damage !== undefined && a.damage !== '' ? <b>{a.damage}</b> : null}</header>
          {a.effect ? <p>{a.effect}</p> : null}</article>)}</div></section> : null}
        {card.weaknesses?.length || card.resistances?.length || card.retreat != null ? <section className="dx-section"><h2>Điểm yếu, kháng & rút lui</h2><dl className="dx-battle">
          <div><dt>Điểm yếu</dt><dd>{card.weaknesses?.length ? card.weaknesses.map((w, i) => <span key={i}><Energy types={[w.type]} />{w.value ?? ''}</span>) : '—'}</dd></div>
          <div><dt>Kháng</dt><dd>{card.resistances?.length ? card.resistances.map((r, i) => <span key={i}><Energy types={[r.type]} />{r.value ?? ''}</span>) : '—'}</dd></div>
          <div><dt>Rút lui</dt><dd>{card.retreat ? <Energy types={Array.from({ length: Math.min(card.retreat, 6) }, () => 'Colorless')} /> : card.retreat === 0 ? 'Miễn phí' : '—'}</dd></div>
        </dl></section> : null}
      </div>

      <aside className="dx-aside">
        <section className="dx-section"><h2>Thông tin lá bài</h2><dl className="dex-facts dx-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
      </aside>
    </div>

    <footer className="dex-attribution"><span>Thông tin và hình ảnh từ TCGdex{dataUpdated ? ` (cập nhật ${dataUpdated})` : ''}. Giá TCGplayer (USD) và Cardmarket (EUR) do TCGdex tổng hợp; giá theo tình trạng/grading từ Scrydex khi có.</span><a href="https://www.tcgdex.net" target="_blank" rel="noopener noreferrer">Truy cập TCGdex<ArrowUpRight size={13} aria-hidden="true" /></a></footer>
  </div></CurrencyProvider>
}
