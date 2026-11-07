import { createClient } from '@/lib/supabase/server'
import { PHOTO_BUCKET, parsePhotos } from '../domain'
import { AdminPhotoGallery } from './admin-photo-gallery'
export async function TradeinAttachments({photos}:{photos:unknown}) {
  const files=parsePhotos(photos)
  if(!files.length)return null
  // Session client + Storage RLS: only authorized staff can sign these paths.
  const sb=await createClient()
  const {data,error}=await sb.storage.from(PHOTO_BUCKET).createSignedUrls(files.map(p=>p.path),600)
  if(error)return <p className="text-sm text-bad">Chưa mở được ảnh khách gửi. Tải lại trang để thử lại.</p>
  const signed=files.map((p,i)=>({name:p.name,url:data?.[i]?.signedUrl??''})).filter(p=>p.url)
  return <AdminPhotoGallery photos={signed} total={files.length}/>
}
