'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WifiOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'

/** A single table subscription per mounted admin shell; no customer-side channel. */
export function AdminConnection({ demo, table = 'orders' }: { demo: boolean; table?: 'orders' | 'variants' }) {
  const router = useRouter()
  const [online, setOnline] = useState(true)
  const [changed, setChanged] = useState(false)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    update()
    window.addEventListener('online', update); window.addEventListener('offline', update)
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('/admin-sw.js', { scope: '/' }).catch(() => {})
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  useEffect(() => {
    if (demo || !online) return
    const sb = createClient()
    const ch = sb.channel(`admin-${table}`).on('postgres_changes', { event: '*', schema: 'public', table }, () => setChanged(true)).subscribe()
    return () => { void sb.removeChannel(ch) }
  }, [demo, online, table])
  if (!online) return <div role="status" className="admin-offline flex items-center gap-2"><WifiOff size={17} className="shrink-0" aria-hidden="true" />Mất kết nối. Giữ cửa sổ này mở; kết nối lại trước khi lưu hoặc thanh toán.</div>
  return changed ? <div role="status" className="admin-demo justify-between"><span>Có dữ liệu mới. Tải lại khi bạn đã hoàn tất thao tác.</span><button type="button" className="btn btn-secondary btn-sm" onClick={() => { router.refresh(); setChanged(false) }}>Cập nhật</button></div> : null
}
