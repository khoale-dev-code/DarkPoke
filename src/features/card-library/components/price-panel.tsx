'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import { ArrowUpRight, Info } from 'lucide-react'
import { cardmarketSearchUrl, formatUpdated, tcgplayerSearchUrl, type CardMarket } from '../pricing'
import { CurrencyToggle, Money, MoneyCounterpart, RateNote } from './currency'

type Source = 'tcgplayer' | 'cardmarket'
interface View { key: string; label: string; headline: number | null; headlineLabel: string; cells: [string, number | null][] }

/** Roving-tabindex keyboard support shared by the source and variant tab lists. */
function tabKeys(count: number, select: (index: number) => void, idFor: (index: number) => string) {
  return (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === 'ArrowRight' ? (index + 1) % count : event.key === 'ArrowLeft' ? (index - 1 + count) % count
      : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : -1
    if (next < 0) return
    event.preventDefault(); select(next)
    document.getElementById(idFor(next))?.focus()
  }
}

function views(market: CardMarket, source: Source): { currency: string; updated: string | null; items: View[] } | null {
  if (source === 'tcgplayer' && market.tcgplayer) return {
    currency: market.tcgplayer.currency, updated: market.tcgplayer.updated,
    items: market.tcgplayer.variants.map((v) => ({
      key: v.key, label: v.label, headline: v.market ?? v.mid ?? v.low, headlineLabel: v.market != null ? 'Market price' : 'Giá tham khảo',
      cells: [['Thấp nhất', v.low], ['Trung bình', v.mid], ['Cao nhất', v.high], ['Direct thấp nhất', v.directLow]]
    }))
  }
  if (source === 'cardmarket' && market.cardmarket) return {
    currency: market.cardmarket.currency, updated: market.cardmarket.updated,
    items: market.cardmarket.rows.map((row) => ({
      key: row.label, label: row.label, headline: row.trend ?? row.avg ?? row.avg30 ?? row.low, headlineLabel: row.trend != null ? 'Xu hướng giá' : 'Giá tham khảo',
      cells: [['Trung bình', row.avg], ['Thấp nhất', row.low], ['TB 1 ngày', row.avg1], ['TB 7 ngày', row.avg7], ['TB 30 ngày', row.avg30]]
    }))
  }
  return null
}

const SOURCE_LABEL: Record<Source, string> = { tcgplayer: 'TCGplayer', cardmarket: 'Cardmarket' }

/**
 * One price card at the top of the page. TCGplayer comes first; when TCGdex has no TCGplayer listing
 * (common for promos and Europe-only prints) the card opens on Cardmarket instead of reporting "no price".
 */
export function MarketPanel({ market, name, setName }: { market: CardMarket; name: string; setName: string }) {
  const id = useId()
  const sources = (['tcgplayer', 'cardmarket'] as Source[]).filter((source) => views(market, source)?.items.length)
  const [sourceIndex, setSourceIndex] = useState(0)
  const [variantIndex, setVariantIndex] = useState(0)
  const source = sources[sourceIndex] ?? sources[0]
  const data = source ? views(market, source) : null
  const view = data?.items[variantIndex] ?? data?.items[0]
  const sourceKeys = tabKeys(sources.length, (i) => { setSourceIndex(i); setVariantIndex(0) }, (i) => `${id}-src-${i}`)
  const variantKeys = tabKeys(data?.items.length ?? 0, setVariantIndex, (i) => `${id}-var-${i}`)

  if (!source || !data || !view) return <section className="dx-price dx-price-empty" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>Giá thị trường</h2>
    <p>TCGplayer và Cardmarket chưa có giá cho lá bài này. Bạn có thể xem tin đăng trực tiếp:</p>
    <div className="dx-price-links">
      <a className="dx-price-link" href={tcgplayerSearchUrl(name, setName)} target="_blank" rel="noopener noreferrer">Tìm trên TCGplayer<ArrowUpRight size={14} aria-hidden="true" /></a>
      <a className="dx-price-link" href={cardmarketSearchUrl(name)} target="_blank" rel="noopener noreferrer">Tìm trên Cardmarket<ArrowUpRight size={14} aria-hidden="true" /></a>
    </div>
  </section>

  const updated = formatUpdated(data.updated)
  const onlyCardmarket = !market.tcgplayer && source === 'cardmarket'

  return <section className="dx-price" aria-labelledby={`${id}-title`}>
    <header className="dx-price-head">
      <div><h2 id={`${id}-title`}>Giá thị trường</h2><p>{SOURCE_LABEL[source]} · {data.currency}{updated ? ` · cập nhật ${updated}` : ''}</p></div>
      <CurrencyToggle currency={data.currency} />
    </header>

    {sources.length > 1 ? <div className="dx-sources" role="tablist" aria-label="Nguồn giá">
      {sources.map((item, index) => {
        const first = views(market, item)!.items[0]!
        return <button key={item} id={`${id}-src-${index}`} type="button" role="tab" aria-selected={index === sourceIndex} tabIndex={index === sourceIndex ? 0 : -1}
          aria-controls={`${id}-panel`} onClick={() => { setSourceIndex(index); setVariantIndex(0) }} onKeyDown={(event) => sourceKeys(event, index)}>
          <span>{SOURCE_LABEL[item]}</span><b><Money value={first.headline} currency={views(market, item)!.currency} /></b>
        </button>
      })}
    </div> : null}

    {onlyCardmarket ? <p className="dx-price-note"><Info size={14} aria-hidden="true" />TCGplayer chưa niêm yết lá bài này (thường gặp với thẻ promo hoặc bản phát hành riêng). Đang hiển thị giá Cardmarket.</p> : null}

    {data.items.length > 1 ? <div className="dx-tabs" role="tablist" aria-label="Phiên bản in">
      {data.items.map((item, index) => <button key={item.key} id={`${id}-var-${index}`} type="button" role="tab" aria-selected={index === variantIndex} tabIndex={index === variantIndex ? 0 : -1}
        aria-controls={`${id}-panel`} onClick={() => setVariantIndex(index)} onKeyDown={(event) => variantKeys(event, index)}>{item.label}</button>)}
    </div> : null}

    <div id={`${id}-panel`} role={sources.length > 1 || data.items.length > 1 ? 'tabpanel' : undefined}>
      <div className="dx-price-main">
        <span className="dx-price-label">{view.headlineLabel}{data.items.length === 1 ? ` · ${view.label}` : ''}</span>
        <strong className="dx-price-value"><Money value={view.headline} currency={data.currency} /></strong>
        <MoneyCounterpart value={view.headline} currency={data.currency} />
      </div>
      <dl className={`dx-price-grid ${view.cells.length === 5 ? 'dx-price-grid-5' : ''}`}>
        {view.cells.map(([label, value]) => <div key={label}><dt>{label}</dt><dd><Money value={value} currency={data.currency} /></dd></div>)}
      </dl>
      <RateNote currency={data.currency} />
    </div>

    <div className="dx-price-links">
      {market.tcgplayer || source === 'tcgplayer' ? <a className="dx-price-link" href={tcgplayerSearchUrl(name, setName)} target="_blank" rel="noopener noreferrer">Xem niêm yết trên TCGplayer<ArrowUpRight size={14} aria-hidden="true" /></a> : null}
      {market.cardmarket ? <a className="dx-price-link" href={cardmarketSearchUrl(name)} target="_blank" rel="noopener noreferrer">Xem trên Cardmarket<ArrowUpRight size={14} aria-hidden="true" /></a> : null}
    </div>
  </section>
}
