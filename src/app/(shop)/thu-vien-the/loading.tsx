import { LibraryGridSkeleton } from '@/features/card-library/components/card-tile'
import '@/features/card-library/library.css'
export default function Loading(){return <div className="shop-container dex-page" role="status"><span className="shop-eyebrow">Pokémon TCG</span><h1 className="h-page mt-4 mb-3">Thư viện thẻ</h1><p className="mb-7 text-sm text-muted">Đang tải dữ liệu thẻ…</p><LibraryGridSkeleton/></div>}
