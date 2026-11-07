'use client'
import { useId, useState } from 'react'
import { Table2 } from 'lucide-react'
import { formatVND } from '@/lib/utils'
export function RevenueChart({ data }: { data:{day:string;total:number}[] }) {
  const [active,setActive] = useState<number | null>(null)
  const [table,setTable] = useState(false)
  const uid = useId().replaceAll(':','')
  const max = Math.max(...data.map((d) => d.total),1)
  const ceiling = Math.max(1_000_000,Math.ceil(max/5_000_000)*5_000_000)
  const width=900, height=230, left=62, right=30, top=16, bottom=36
  const plotHeight=height-top-bottom; const step=(width-left-right)/Math.max(data.length,1)
  const date=(day:string) => `${day.slice(8,10)}/${day.slice(5,7)}`
  const focus=active === null ? null : data[active]
  return <div><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs text-muted">Tổng 7 ngày, theo ngày tạo đơn đã thanh toán</p><p className="mt-2 font-sans text-2xl font-semibold tracking-tight">{formatVND(data.reduce((s,d) => s+d.total,0))}</p></div><button type="button" className="btn btn-secondary btn-sm" aria-pressed={table} onClick={() => setTable(!table)}><Table2 size={15} aria-hidden="true" />{table ? 'Biểu đồ' : 'Bảng số liệu'}</button></div>
    {table ? <div className="table-wrap"><table className="tbl"><caption className="sr-only">Doanh thu bảy ngày</caption><thead><tr><th>Ngày</th><th className="num">Doanh thu</th></tr></thead><tbody>{data.map((d) => <tr key={d.day}><td>{date(d.day)}</td><td className="num">{formatVND(d.total)}</td></tr>)}</tbody></table></div> : <div className="admin-chart" onPointerLeave={() => setActive(null)}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Doanh thu 7 ngày. Dùng nút Bảng số liệu để đọc toàn bộ giá trị.">
        <defs><pattern id={`pattern-${uid}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="2" height="6" fill="currentColor" /></pattern></defs>
        {[0,.25,.5,.75,1].map((ratio) => {const y=top+plotHeight*(1-ratio);return <g key={ratio}><line x1={left} x2={width-right} y1={y} y2={y} stroke="#e8ecf3" strokeWidth="1" /><text x={left-12} y={y+4} textAnchor="end" fill="#56657c" fontSize="11">{Math.round(ceiling*ratio/1_000_000)}tr</text></g>})}
        {data.map((d,i) => { const x=left+step*(i+.5); const h=d.total/ceiling*plotHeight; const y=top+plotHeight-h;return <g key={d.day} tabIndex={0} role="button" aria-label={`${date(d.day)}: ${formatVND(d.total)}`} onFocus={() => setActive(i)} onBlur={() => setActive(null)} onPointerEnter={() => setActive(i)} onPointerDown={() => setActive(i)} onKeyDown={(e) => {if(e.key==='Escape')setActive(null)}} style={{outline:'none'}}>
          <rect x={x-step/2+2} y={top} width={step-4} height={plotHeight+bottom-6} fill="transparent" />
          {d.total > 0 ? <path d={`M ${x-12} ${top+plotHeight} V ${y+Math.min(4,h)} Q ${x-12} ${y} ${x-8} ${y} H ${x+8} Q ${x+12} ${y} ${x+12} ${y+Math.min(4,h)} V ${top+plotHeight} Z`} fill="#1b4fe0" opacity={active === null || active === i ? 1 : .45} /> : null}
          {active === i ? <rect x={x-18} y={top-4} width={36} height={plotHeight+8} fill="none" stroke="#8591a5" rx={4} /> : null}
          <text x={x} y={height-9} textAnchor="middle" fill="#56657c" fontSize="11">{date(d.day)}</text>
        </g>})}
      </svg>
      {focus ? <div className="admin-chart-tooltip" role="status" style={{left:`clamp(0px, ${((active!+.5)/data.length)*100}%, calc(100% - 175px))`}}><span className="text-muted">Ngày {date(focus.day)}</span><strong>{formatVND(focus.total)}</strong></div> : null}
    </div>}
  </div>
}
