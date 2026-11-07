'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Images, RotateCw, X } from 'lucide-react'
import '../tradein-admin.css'
export function AdminPhotoGallery({photos,total}:{photos:{name:string;url:string}[];total:number}) {
  const [expanded,setExpanded]=useState(false);const [selected,setSelected]=useState<number|null>(null);const [failed,setFailed]=useState(false)
  const dialog=useRef<HTMLDialogElement>(null);const router=useRouter()
  useEffect(()=>{const d=dialog.current;if(!d)return;if(selected!==null&&!d.open)d.showModal();if(selected===null&&d.open)d.close();if(selected===null)return
    const previous=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';return()=>{document.documentElement.style.overflow=previous}
  },[selected])
  const change=(offset:number)=>{setSelected(n=>((n??0)+offset+photos.length)%photos.length);setFailed(false)}
  return <div className="t3-admin-photos"><div><button type="button" className="btn btn-secondary" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}><Images size={17} aria-hidden="true"/>{expanded?'Ẩn ảnh':`Xem ${total} ảnh khách gửi`}</button>{expanded?<button type="button" className="btn btn-ghost" onClick={()=>{setFailed(false);router.refresh()}}><RotateCw size={16} aria-hidden="true"/>Làm mới ảnh</button>:null}</div>
    {expanded?<><p>Ảnh riêng tư · Bấm vào ảnh để xem lớn. Liên kết xem ảnh có hiệu lực 10 phút.</p><div className="t3-admin-photo-grid">{photos.map((p,i)=><button key={p.url} type="button" onClick={()=>{setSelected(i);setFailed(false)}} aria-label={`Xem ảnh ${i+1}: ${p.name}`}><img src={p.url} alt={p.name} width={180} height={180} loading="lazy" decoding="async" referrerPolicy="no-referrer"/><span>Ảnh {i+1}</span></button>)}</div>{photos.length<total?<p role="status">Một số ảnh chưa mở được. Bấm làm mới ảnh để thử lại.</p>:null}</>:null}
    <dialog ref={dialog} className="t3-admin-dialog" aria-label="Ảnh thực tế khách gửi" onCancel={e=>{e.preventDefault();setSelected(null)}} onClose={()=>setSelected(null)} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();change(1)}if(e.key==='ArrowLeft'){e.preventDefault();change(-1)}}}>
      <header><b>Ảnh {selected===null?0:selected+1}/{photos.length}</b><button type="button" className="btn btn-ghost btn-icon" aria-label="Đóng ảnh" onClick={()=>setSelected(null)}><X size={21}/></button></header>
      {selected!==null?<div className="t3-admin-large">{failed?<p role="alert">Ảnh chưa tải được hoặc liên kết đã hết hạn. Đóng ảnh và bấm “Làm mới ảnh”.</p>:<img src={photos[selected]?.url} alt={photos[selected]?.name} width={1000} height={1000} referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>}</div>:null}
      <footer><button type="button" className="btn btn-secondary" onClick={()=>change(-1)} disabled={photos.length<2}><ChevronLeft size={17}/>Ảnh trước</button><button type="button" className="btn btn-secondary" onClick={()=>change(1)} disabled={photos.length<2}>Ảnh sau<ChevronRight size={17}/></button></footer>
    </dialog>
  </div>
}
