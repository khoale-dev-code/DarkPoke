'use client'

import Link from 'next/link'
import { useDeferredValue } from 'react'
import { ArrowDown, ArrowUp, Check, Loader2, Pause, Play, RefreshCw, Search, WifiOff } from 'lucide-react'
import { LANGUAGES, libraryHref, type LibraryPage, type LibraryQuery } from '../domain'
import { useInfiniteLibrary } from '../hooks/use-infinite-library'
import { LibraryTile, LibraryTileSkeleton } from './card-tile'

interface Props { query: LibraryQuery; initial: LibraryPage; typeNames: Record<string, string>; series?: Record<string, string> }

export function LibraryCardGrid({ query, initial, typeNames, series = {} }: Props) {
  const { cards: loaded, sentinel, automatic, setAutomatic, observerSupported, loadMore,
    hasNextPage, isFetchingNextPage, isError, isPaused } = useInfiniteLibrary(query, initial)
  // V14.25: a new batch is rendered as a low-priority update that yields to scrolling, instead of one long task.
  const cards = useDeferredValue(loaded)
  // Skeletons stay until the deferred batch is on screen, so the grid never shrinks for a frame (that made the page jump).
  const pendingBatch = isFetchingNextPage || cards !== loaded
  const title = query.q ? `Kết quả cho “${query.q}”` : query.set ? typeNames[query.set] ?? query.set : 'Khám phá danh sách thẻ'
  const language = LANGUAGES.find(language => language.code === query.lang)?.label
  const atEnd = !hasNextPage
  const showError = isError && !isFetchingNextPage

  return <section id="dex-results" className="dex-results" aria-labelledby="dex-results-title">
    <header className="dex-results-head">
      <div><h2 id="dex-results-title">{title}</h2><p><b>{cards.length}</b> thẻ đã hiển thị<span aria-hidden="true"> · </span>{language}</p></div>
    </header>

    {!cards.length ? <div className="dex-empty"><span><Search size={28} strokeWidth={1.5} aria-hidden="true"/></span><h2>Chưa tìm thấy thẻ phù hợp</h2><p>Thử tên theo ngôn ngữ đã chọn, kiểm tra mã đầy đủ hoặc bỏ bớt bộ lọc.</p><Link prefetch={false} href={libraryHref({ ...query, q: '', by: 'name', set: '', page: 1 })} className="btn btn-primary">Khám phá lại thư viện</Link></div>
      : <div className="dex-grid" aria-busy={pendingBatch}>
        {cards.map((card, i) => <LibraryTile key={`${query.lang}:${card.id}`} card={card} query={query} setName={typeNames[card.setId]} serie={series[card.setId]} priority={i < 2}/>)}
        {pendingBatch ? Array.from({ length: 6 }, (_, i) => <LibraryTileSkeleton key={`next-skeleton:${i}`}/>) : null}
      </div>}

    <div ref={sentinel} className="dex-sentinel" aria-hidden="true"/>
    {cards.length > 0 ? <div className="dex-load-area" id="dex-library-end">
      <div className="dex-load-status" role="status" aria-live="polite" aria-atomic="true">
        {isPaused ? <><WifiOff size={20} aria-hidden="true"/><p>Đang chờ kết nối mạng<span>Các thẻ đã tải vẫn được giữ lại.</span></p></>
          : showError ? <><WifiOff size={20} aria-hidden="true"/><p>Chưa tải được các thẻ tiếp theo<span>Danh sách đang xem vẫn được giữ nguyên.</span></p></>
          : isFetchingNextPage ? <><Loader2 size={20} className="animate-spin" aria-hidden="true"/><p>Đang tải thêm thẻ…<span>Bạn có thể tiếp tục xem các thẻ phía trên.</span></p></>
          : atEnd ? <><Check size={20} aria-hidden="true"/><p>Bạn đã xem hết {cards.length} thẻ phù hợp<span>Thử một bộ thẻ hoặc từ khóa khác để khám phá tiếp.</span></p></>
          : <><ArrowDown size={20} aria-hidden="true"/><p>{automatic && observerSupported ? 'Cuộn xuống, thẻ mới sẽ tự xuất hiện' : automatic ? 'Khám phá thêm các thẻ tiếp theo' : 'Đã tạm dừng tải thêm'}<span>{automatic ? `${cards.length} thẻ đã sẵn sàng để khám phá.` : 'Bạn có thể xem chân trang hoặc tiếp tục bất cứ lúc nào.'}</span></p></>}
      </div>
      <div className="dex-load-actions">
        {showError ? <button type="button" className="btn btn-secondary" onClick={loadMore}><RefreshCw size={16} aria-hidden="true"/>Thử tải lại</button>
          : hasNextPage && !observerSupported ? <button type="button" className="btn btn-secondary" onClick={loadMore} disabled={isFetchingNextPage || isPaused}><ArrowDown size={16} aria-hidden="true"/>Tải thêm thẻ</button>
          : hasNextPage ? <button type="button" className="btn btn-ghost" aria-pressed={!automatic} onClick={() => setAutomatic(value => !value)}>{automatic ? <Pause size={15} aria-hidden="true"/> : <Play size={15} aria-hidden="true"/>}{automatic ? 'Tạm dừng tải thêm' : 'Tiếp tục khám phá'}</button> : null}
        <a href="#dex-library-top" className="btn btn-ghost"><ArrowUp size={15} aria-hidden="true"/>Về đầu danh sách</a>
      </div>
    </div> : null}
  </section>
}
