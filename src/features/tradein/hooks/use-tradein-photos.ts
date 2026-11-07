'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_PHOTOS, photoFileError } from '../domain'
export interface LocalPhoto { id: string; itemId: string; file: File; url: string }
export function useTradeinPhotos() {
  const [photos,setPhotos] = useState<LocalPhoto[]>([])
  const [errors,setErrors] = useState<string[]>([])
  const current = useRef<LocalPhoto[]>([])
  useEffect(() => () => current.current.forEach(p => URL.revokeObjectURL(p.url)),[])
  const replace = useCallback((next: LocalPhoto[]) => { current.current=next; setPhotos(next) },[])
  const add = useCallback((itemId: string, files: FileList | File[]) => {
    const picked=Array.from(files); const existing=current.current
    if (picked.length>MAX_PHOTOS-existing.length) {setErrors([`Bạn chỉ có thể thêm ${MAX_PHOTOS-existing.length} ảnh nữa. Tối đa 14 ảnh cho toàn bộ yêu cầu.`]);return}
    const messages:string[]=[]; const next=[...existing]
    for (const file of picked) {
      const error=photoFileError(file)
      if(error){messages.push(error);continue}
      if(next.some(p=>p.itemId===itemId&&p.file.name===file.name&&p.file.size===file.size&&p.file.lastModified===file.lastModified)){messages.push(`${file.name}: ảnh đã được chọn cho vật phẩm này.`);continue}
      next.push({id:crypto.randomUUID(),itemId,file,url:URL.createObjectURL(file)})
    }
    replace(next);setErrors(messages)
  },[replace])
  const remove = useCallback((id:string)=>{const p=current.current.find(p=>p.id===id);if(p)URL.revokeObjectURL(p.url);replace(current.current.filter(p=>p.id!==id));setErrors([])},[replace])
  const removeItem = useCallback((itemId:string)=>{current.current.filter(p=>p.itemId===itemId).forEach(p=>URL.revokeObjectURL(p.url));replace(current.current.filter(p=>p.itemId!==itemId));setErrors([])},[replace])
  const reset = useCallback(()=>{current.current.forEach(p=>URL.revokeObjectURL(p.url));replace([]);setErrors([])},[replace])
  return {photos,errors,add,remove,removeItem,reset,clearErrors:()=>setErrors([])}
}
