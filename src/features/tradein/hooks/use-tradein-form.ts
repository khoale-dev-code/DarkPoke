'use client'
import { useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { prepareTradein, submitTradein } from '@/lib/actions/tradein'
import { isDemo } from '@/lib/env'
import { blankItem, tradeinSchema, type TradeinInput, type TradeinValues, type UploadTicket } from '../domain'
import { photoDescriptors, uploadPhotos } from '../client-upload'
import { useTradeinPhotos } from './use-tradein-photos'
interface Attempt {signature:string;ticket:UploadTicket;uploaded:Set<number>;createdAt:number;demo:boolean}
const defaults=():TradeinInput=>({items:[blankItem()],name:'',phone:'',email:'',method:'store',payout:'cash',note:''})
export function useTradeinForm() {
  const form=useForm<TradeinInput,unknown,TradeinValues>({resolver:zodResolver(tradeinSchema),defaultValues:defaults(),mode:'onBlur',reValidateMode:'onChange'})
  const fields=useFieldArray({control:form.control,name:'items'})
  const media=useTradeinPhotos();const attempt=useRef<Attempt|null>(null)
  const [error,setError]=useState('');const [progress,setProgress]=useState('');const [success,setSuccess]=useState<string|null>(null)
  const submit=form.handleSubmit(async values=>{
    setError('');setProgress('Đang chuẩn bị yêu cầu…')
    const signature=JSON.stringify([values,media.photos.map(p=>p.id)])
    try {
      let current=attempt.current
      if(!current||current.signature!==signature||Date.now()-current.createdAt>115*60000){
        const descriptors=await photoDescriptors(media.photos)
        const result=await prepareTradein(values,descriptors)
        if(!result.ok||!result.data)throw new Error(!result.ok?result.error:'Chưa tạo được phiên gửi.')
        current={signature,ticket:{id:result.data.id,token:result.data.token},uploaded:new Set(),createdAt:Date.now(),demo:!!result.data.demo}
        attempt.current=current
      }
      if(!current.demo&&media.photos.length){
        setProgress(`Đang tải ảnh ${current.uploaded.size}/${media.photos.length}…`)
        await uploadPhotos(current.ticket,media.photos,current.uploaded,n=>setProgress(`Đang tải ảnh ${n}/${media.photos.length}…`))
      }
      setProgress('Đang xác nhận yêu cầu…')
      const result=await submitTradein(current.ticket)
      if(!result.ok||!result.data)throw new Error(!result.ok?result.error:'Chưa nhận được xác nhận.')
      setSuccess(result.data.code);media.reset();attempt.current=null
    }catch(e){if(e instanceof Error&&e.name==='UploadExpired')attempt.current=null;setError(e instanceof Error&&e.name!=='AbortError'?e.message:'Kết nối bị gián đoạn. Bấm gửi lại để tiếp tục tải ảnh còn thiếu.')}finally{setProgress('')}
  })
  function addItem(){fields.append(blankItem(`item-${crypto.randomUUID()}`))}
  function removeItem(index:number){media.removeItem(form.getValues(`items.${index}.client_id`));fields.remove(index)}
  function reset(){form.reset(defaults());media.reset();attempt.current=null;setSuccess(null);setError('')}
  return {form,fields,media,submit,addItem,removeItem,error,progress,success,reset,isDemo}
}
