import Link from 'next/link'
import '@/features/card-library/library.css'
export default function CardNotFound(){return <div className="shop-container dex-page"><section className="dex-empty"><h1>Chưa tìm thấy thẻ này</h1><p>Thẻ có thể chưa có dữ liệu trong ngôn ngữ đã chọn. Quay lại thư viện để tìm tên, mã hoặc ngôn ngữ khác.</p><Link href="/thu-vien-the" className="btn btn-primary">Về thư viện thẻ</Link></section></div>}
