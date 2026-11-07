import { formatMoney, formatPercent, type PriceHistory } from '../pricing'
import { Money } from './currency'

const W = 640
const H = 180
const PAD = { top: 14, right: 12, bottom: 24, left: 12 }

const shortDate = (date: string) => { const [, month, day] = date.split('-'); return `${day}/${month}` }

/** Server-rendered area chart (no chart library); the data table below is the accessible version. */
export function PriceChart({ history }: { history: PriceHistory }) {
  const points = history.points
  const values = points.map((point) => point.market)
  const min = Math.min(...values); const max = Math.max(...values)
  const span = max - min || Math.max(max * 0.1, 0.01)
  const x = (index: number) => PAD.left + (index / Math.max(points.length - 1, 1)) * (W - PAD.left - PAD.right)
  const y = (value: number) => PAD.top + (1 - (value - min) / span) * (H - PAD.top - PAD.bottom)
  const line = points.map((point, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(point.market).toFixed(1)}`).join(' ')
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - PAD.bottom} L${x(0).toFixed(1)},${H - PAD.bottom} Z`
  const first = points[0]!; const last = points.at(-1)!
  const change = first.market ? ((last.market - first.market) / first.market) * 100 : 0
  const direction = change > 0.05 ? 'up' : change < -0.05 ? 'down' : 'flat'
  const weekly = points.filter((_, index) => index % 7 === 0 || index === points.length - 1)

  return <figure className="dx-chart" data-direction={direction}>
    <figcaption>
      <span>Lịch sử giá Near Mint · {points.length} ngày</span>
      <b><Money value={last.market} currency={history.currency} /><em>{formatPercent(change)}</em></b>
    </figcaption>
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
      aria-label={`Giá market từ ${formatMoney(first.market, history.currency)} ngày ${shortDate(first.date)} đến ${formatMoney(last.market, history.currency)} ngày ${shortDate(last.date)}, thấp nhất ${formatMoney(min, history.currency)}, cao nhất ${formatMoney(max, history.currency)}.`}>
      <defs><linearGradient id="dx-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".22" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
      {[0, 0.5, 1].map((ratio) => <line key={ratio} x1={PAD.left} x2={W - PAD.right} y1={PAD.top + ratio * (H - PAD.top - PAD.bottom)} y2={PAD.top + ratio * (H - PAD.top - PAD.bottom)} className="dx-chart-grid" />)}
      <path d={area} fill="url(#dx-chart-fill)" />
      <path d={line} className="dx-chart-line" vectorEffect="non-scaling-stroke" />
      <circle cx={x(points.length - 1)} cy={y(last.market)} r="3.5" className="dx-chart-dot" vectorEffect="non-scaling-stroke" />
    </svg>
    <div className="dx-chart-axis" aria-hidden="true"><span>{shortDate(first.date)}</span><span>Thấp <Money value={min} currency={history.currency} /> · Cao <Money value={max} currency={history.currency} /></span><span>{shortDate(last.date)}</span></div>
    <details className="dx-chart-table">
      <summary>Xem bảng số liệu theo tuần</summary>
      <table><thead><tr><th scope="col">Ngày</th><th scope="col">Market</th><th scope="col">Thấp</th></tr></thead>
        <tbody>{weekly.map((point) => <tr key={point.date}><td>{point.date.split('-').reverse().join('/')}</td><td><Money value={point.market} currency={history.currency} /></td><td><Money value={point.low} currency={history.currency} /></td></tr>)}</tbody></table>
    </details>
  </figure>
}
