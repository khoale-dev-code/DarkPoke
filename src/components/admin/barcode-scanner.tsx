'use client'
import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff } from 'lucide-react'
interface Detector { detect(source:HTMLVideoElement):Promise<{rawValue:string}[]> }
interface DetectorConstructor { new(options:{formats:string[]}):Detector; getSupportedFormats():Promise<string[]> }
export default function BarcodeScanner({onScan}:{onScan:(value:string)=>void}) {
  const video=useRef<HTMLVideoElement>(null)
  const callback=useRef(onScan); callback.current=onScan
  const [message,setMessage]=useState('Đang mở camera…')
  const [failed,setFailed]=useState(false)
  useEffect(()=>{
    let cancelled=false;let stream:MediaStream|undefined;let frame=0;let working=false
    const stop=()=>{cancelled=true;cancelAnimationFrame(frame);stream?.getTracks().forEach((t)=>t.stop())}
    async function start() {
      try {
        const Constructor=(window as unknown as {BarcodeDetector?:DetectorConstructor}).BarcodeDetector
        if(!Constructor || !navigator.mediaDevices?.getUserMedia)throw new Error('Trình duyệt này chưa hỗ trợ quét camera. Hãy nhập SKU vào ô tìm kiếm hoặc dùng máy quét mã vạch.')
        const formats=(await Constructor.getSupportedFormats()).filter((f)=>['ean_13','ean_8','code_128','code_39','upc_a','upc_e','qr_code'].includes(f))
        if(!formats.length)throw new Error('Camera chưa hỗ trợ loại mã cần dùng. Bạn có thể nhập SKU hoặc dùng máy quét.')
        const detector=new Constructor({formats})
        stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false})
        if(cancelled){stream.getTracks().forEach(t=>t.stop());return}
        if(!video.current)return
        video.current.srcObject=stream;await video.current.play();setMessage('Đưa mã vạch vào giữa khung hình.')
        const scan=async()=>{
          if(cancelled)return
          if(!working && video.current && video.current.readyState>=2){working=true;try {const found=await detector.detect(video.current);if(!cancelled && found[0]?.rawValue){const value=found[0].rawValue.slice(0,60);stop();callback.current(value);return}}catch{/* Retry next frame; video can briefly be unreadable. */}finally{working=false}}
          if(!cancelled)frame=requestAnimationFrame(scan)
        }
        frame=requestAnimationFrame(scan)
      } catch(e){if(!cancelled){setFailed(true);setMessage(e instanceof Error && e.name==='NotAllowedError'?'Bạn chưa cho phép camera. Bật quyền camera của trình duyệt hoặc nhập SKU bằng tay.':e instanceof Error?e.message:'Chưa mở được camera. Hãy nhập SKU bằng tay.')}}
    }
    void start();return stop
  },[])
  return <div className="flex flex-col gap-4">{failed?<CameraOff size={32} className="text-muted" aria-hidden="true"/>:<><video ref={video} className="aspect-[4/3] w-full rounded-xl bg-ink object-cover" muted playsInline/><span className="flex items-center gap-2 text-xs text-muted"><Camera size={16} aria-hidden="true"/>Chỉ đọc mã trên thiết bị, không tải video lên.</span></>}<p role="status" className="text-sm leading-relaxed text-muted">{message}</p></div>
}
