import type { PhotoDescriptor, UploadTicket } from './domain'
import type { LocalPhoto } from './hooks/use-tradein-photos'
export async function photoDescriptors(photos:LocalPhoto[]):Promise<PhotoDescriptor[]> {
  const result:PhotoDescriptor[]=[]
  for(const p of photos){const digest=await crypto.subtle.digest('SHA-256',await p.file.arrayBuffer());result.push({item_id:p.itemId,name:p.file.name.slice(0,180),size:p.file.size,mime:p.file.type as PhotoDescriptor['mime'],sha256:Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('')})}
  return result
}
export async function uploadPhotos(ticket:UploadTicket,photos:LocalPhoto[],uploaded:Set<number>,onProgress:(count:number)=>void) {
  let cursor=0;const errors:Error[]=[]
  async function worker(){for(;;){const slot=cursor++;if(slot>=photos.length||errors.length)return;if(uploaded.has(slot))continue;const photo=photos[slot];if(!photo)return
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),30000)
    try {
      const body=new FormData();body.set('file',photo.file)
      const response=await fetch('/api/tradein/photos',{method:'POST',headers:{'x-tradein-id':ticket.id,'x-tradein-token':ticket.token,'x-tradein-slot':String(slot)},body,signal:controller.signal})
      const result=await response.json().catch(()=>({error:response.status===413?'Ảnh vượt 2 MB.':'Chưa tải được ảnh. Vui lòng thử lại.'}))
      if(!response.ok){const e=new Error(result.error??'Chưa tải được ảnh.');if(response.status===410)e.name='UploadExpired';throw e}
      uploaded.add(slot);onProgress(uploaded.size)
    }catch(error){errors.push(error instanceof Error?error:new Error('Mất kết nối khi tải ảnh.'))}finally{clearTimeout(timer)}
  }}
  await Promise.all([worker(),worker()])
  if(errors.length)throw errors[0]
}
