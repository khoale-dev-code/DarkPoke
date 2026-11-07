'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw } from 'lucide-react'
export function RefreshLibrary() {const router=useRouter();const [pending,start]=useTransition();return <button type="button" className="btn btn-secondary" disabled={pending} onClick={()=>start(()=>router.refresh())}>{pending?<Loader2 size={16} className="animate-spin" aria-hidden="true"/>:<RefreshCw size={16} aria-hidden="true"/>}{pending?'Đang thử lại…':'Thử tải lại'}</button>}
