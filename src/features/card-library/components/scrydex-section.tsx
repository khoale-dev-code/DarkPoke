import { ArrowUpRight, Award, ChartColumn, Layers } from 'lucide-react'
import { getScrydexMarket, type MatchInput } from '../server/scrydex'
import { CONDITION_LABELS, formatPercent, type GradedPrice, type PopReport, type ScrydexVariant, type TrendKey, type Trends } from '../pricing'
import { PriceChart } from './price-chart'
import { CurrencyToggle, Money } from './currency'

const GRADED_VISIBLE = 14

function Trend({ trends, period, optional }: { trends: Trends; period: TrendKey; optional?: boolean }) {
  const value = trends[period]
  const className = optional ? 'dx-trend dx-opt' : 'dx-trend'
  if (!value) return <td className={className}>—</td>
  const tone = value.percent > 0.05 ? 'up' : value.percent < -0.05 ? 'down' : 'flat'
  return <td className={className} data-tone={tone}>{formatPercent(value.percent)}</td>
}

function GradedRows({ rows }: { rows: GradedPrice[] }) {
  return <>{rows.map((row, index) => <tr key={`${row.company}:${row.grade}:${row.flags.join()}:${index}`}>
    <th scope="row">{row.company} {row.grade}{row.flags.length ? <small>{row.flags.join(' · ')}</small> : null}</th>
    <td><Money value={row.low} currency={row.currency} /></td><td className="dx-opt"><Money value={row.mid} currency={row.currency} /></td><td className="dx-opt"><Money value={row.high} currency={row.currency} /></td>
    <td className="dx-strong"><Money value={row.market} currency={row.currency} /></td><Trend trends={row.trends} period="days_30" />
  </tr>)}</>
}

function Pop({ reports }: { reports: PopReport[] }) {
  return <div className="dx-pop">
    {reports.map((report) => {
      const top = report.grades.slice(0, 6); const peak = Math.max(...top.map((g) => g.count), 1)
      return <article key={report.company}>
        <header><b>{report.company}</b><span>{report.total.toLocaleString('vi-VN')} thẻ đã chấm</span></header>
        <ul>{top.map((g) => <li key={g.grade}><span>{report.company} {g.grade}</span><span className="dx-pop-bar" aria-hidden="true"><i style={{ width: `${Math.max((g.count / peak) * 100, 2)}%` }} /></span><b>{g.count.toLocaleString('vi-VN')}</b></li>)}</ul>
      </article>
    })}
  </div>
}

function Variant({ variant, open }: { variant: ScrydexVariant; open: boolean }) {
  const nm = variant.raw.find((row) => row.condition === 'NM' && !row.flags.length) ?? variant.raw[0]
  const psa10 = variant.graded.find((row) => row.company === 'PSA' && row.grade === '10' && !row.flags.length)
  return <details className="dx-variant" open={open}>
    <summary>
      <span className="dx-variant-name"><Layers size={16} aria-hidden="true" />{variant.label}</span>
      <span className="dx-variant-summary">
        {nm?.market != null ? <span>NM <b><Money value={nm.market} currency={nm.currency} /></b></span> : null}
        {psa10?.market != null ? <span>PSA 10 <b><Money value={psa10.market} currency={psa10.currency} /></b></span> : null}
      </span>
    </summary>

    {variant.raw.length ? <div className="dx-table-wrap"><table className="dx-table">
      <caption>Thẻ raw theo tình trạng</caption>
      <thead><tr><th scope="col">Tình trạng</th><th scope="col">Thấp nhất</th><th scope="col">Market</th><th scope="col" className="dx-opt">1 ngày</th><th scope="col" className="dx-opt">7 ngày</th><th scope="col">30 ngày</th><th scope="col" className="dx-opt">90 ngày</th></tr></thead>
      <tbody>{variant.raw.map((row, index) => <tr key={`${row.condition}:${row.flags.join()}:${index}`}>
        <th scope="row"><abbr title={CONDITION_LABELS[row.condition] ?? row.condition}>{row.condition}</abbr>{row.flags.length ? <small>{row.flags.join(' · ')}</small> : null}</th>
        <td><Money value={row.low} currency={row.currency} /></td><td className="dx-strong"><Money value={row.market} currency={row.currency} /></td>
        <Trend trends={row.trends} period="days_1" optional /><Trend trends={row.trends} period="days_7" optional /><Trend trends={row.trends} period="days_30" /><Trend trends={row.trends} period="days_90" optional />
      </tr>)}</tbody>
    </table></div> : null}

    {variant.graded.length ? <div className="dx-table-wrap"><table className="dx-table">
      <caption><Award size={15} aria-hidden="true" />Thẻ đã grading</caption>
      <thead><tr><th scope="col">Hãng · điểm</th><th scope="col">Thấp nhất</th><th scope="col" className="dx-opt">Trung vị</th><th scope="col" className="dx-opt">Cao nhất</th><th scope="col">Market</th><th scope="col">30 ngày</th></tr></thead>
      <tbody><GradedRows rows={variant.graded.slice(0, GRADED_VISIBLE)} /></tbody>
    </table>
    {variant.graded.length > GRADED_VISIBLE ? <details className="dx-more"><summary>Xem thêm {variant.graded.length - GRADED_VISIBLE} mức điểm</summary>
      <table className="dx-table"><tbody><GradedRows rows={variant.graded.slice(GRADED_VISIBLE)} /></tbody></table></details> : null}
    </div> : null}

    {variant.pop.length ? <section className="dx-pop-wrap" aria-label={`Pop report ${variant.label}`}><h4><ChartColumn size={15} aria-hidden="true" />Pop report (số lượng thẻ đã chấm)</h4><Pop reports={variant.pop} /></section> : null}
  </details>
}

/** Streams in after the main card facts; renders nothing when Scrydex is not configured or has no match. */
export async function ScrydexSection({ input, lang }: { input: MatchInput; lang: string }) {
  const result = await getScrydexMarket(input, lang)
  if (result.status === 'disabled') return null
  if (result.status !== 'ok') return <section className="dx-section dx-scrydex-empty" aria-label="Giá chi tiết">
    <p>{result.status === 'unmatched' ? 'Chưa có dữ liệu giá theo tình trạng và grading cho lá bài này.' : 'Chưa tải được giá chi tiết theo tình trạng và grading. Giá TCGplayer phía trên vẫn dùng được.'}</p>
  </section>

  const { card, history } = result
  const primary = history ? card.variants.findIndex((v) => v.name === history.variant) : 0
  return <section className="dx-section dx-scrydex" aria-labelledby="dx-scrydex-title">
    <header className="dx-section-head">
      <div><span className="dx-eyebrow">Phân tích giá · Scrydex</span><h2 id="dx-scrydex-title">Giá theo tình trạng & grading</h2>
        <p>{card.expansionName ? `${card.expansionName} · ` : ''}Giá raw theo NM/LP/MP/HP/DM, giá PSA, CGC, BGS… kèm biến động 1–90 ngày.</p></div>
      <div className="dx-section-tools"><CurrencyToggle currency="USD" /><a href="https://scrydex.com" target="_blank" rel="noopener noreferrer" className="dx-source-badge">Scrydex<ArrowUpRight size={12} aria-hidden="true" /></a></div>
    </header>
    {history ? <PriceChart history={history} /> : null}
    <div className="dx-variants">{card.variants.map((variant, index) => <Variant key={variant.name} variant={variant} open={index === Math.max(primary, 0)} />)}</div>
  </section>
}

export function ScrydexSkeleton() {
  return <section className="dx-section" aria-busy="true" aria-label="Đang tải giá chi tiết">
    <span className="skeleton block h-5 w-56" /><span className="skeleton mt-3 block h-4 w-80 max-w-full" />
    <span className="skeleton mt-6 block h-40 w-full" /><span className="skeleton mt-4 block h-14 w-full" />
  </section>
}
