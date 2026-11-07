'use client'
import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
export function ShopDialog({open,onClose,title,description,children,actions,drawer=false,wide=false}:{open:boolean;onClose:()=>void;title:string;description?:string;children:React.ReactNode;actions?:React.ReactNode;drawer?:boolean;wide?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);const id=useId()
  useEffect(()=>{
    const d=ref.current;if(!d)return
    if(open && !d.open)d.showModal()
    if(!open && d.open)d.close()
    if(!open)return
    const previous=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden'
    return()=>{document.documentElement.style.overflow=previous}
  },[open])
  return <dialog ref={ref} className={`shop-dialog ${drawer?'shop-drawer':''} ${wide?'shop-dialog-wide':''}`} aria-labelledby={`${id}-title`} aria-describedby={description?`${id}-description`:undefined} onCancel={(e)=>{e.preventDefault();onClose()}} onClose={onClose} onClick={(e)=>{if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose()}}><div className="shop-dialog-head"><h2 id={`${id}-title`}>{title}</h2><button type="button" className="btn btn-ghost btn-icon" aria-label="Đóng" onClick={onClose}><X size={21} aria-hidden="true"/></button></div><div className="shop-dialog-body">{description?<p id={`${id}-description`} className="shop-dialog-description">{description}</p>:null}{children}</div>{actions?<div className="shop-dialog-actions">{actions}</div>:null}</dialog>
}
