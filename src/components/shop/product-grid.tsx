'use client'
import Link from 'next/link'
import { useEffect,useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ArrowDown,Loader2,PackageSearch } from 'lucide-react'
import { ProductCard,ProductCardSkeleton,GRID } from '@/components/shop/product-card'
import type { ProductPage } from '@/lib/catalog'
interface Props {query:string;initial:ProductPage;typeNames:Record<string,string>;emptyText?:string}
export function ProductGrid({query,initial,typeNames,emptyText='Thử đổi từ khóa hoặc bỏ bớt bộ lọc để khám phá thêm sản phẩm.'}:Props) {
  const sentinel=useRef<HTMLDivElement>(null)
  const {data,fetchNextPage,hasNextPage,isFetchingNextPage,isError,refetch}=useInfiniteQuery({queryKey:['products',query],queryFn:async({pageParam})=>{const qs=new URLSearchParams(query);if(pageParam)qs.set('cursor',pageParam);const res=await fetch(`/api/products?${qs}`);if(!res.ok)throw new Error('load_failed');return await res.json() as ProductPage},initialPageParam:null as string|null,getNextPageParam:last=>last.nextCursor,initialData:{pages:[initial],pageParams:[null]},staleTime:60_000})
  useEffect(()=>{const el=sentinel.current;if(!el||!hasNextPage||isError||!('IntersectionObserver'in window))return;const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!isFetchingNextPage)void fetchNextPage()},{rootMargin:'360px 0px'});io.observe(el);return()=>io.disconnect()},[hasNextPage,isFetchingNextPage,isError,fetchNextPage])
  const items=[...new Map(data.pages.flatMap(p=>p.items).map(p=>[p.id,p])).values()]
  if(!items.length)return <div className="shop-empty"><span className="shop-empty-icon"><PackageSearch size={30} strokeWidth={1.5} aria-hidden="true"/></span><h2>Chưa tìm thấy sản phẩm phù hợp</h2><p>{emptyText}</p><Link href="/san-pham" className="btn btn-primary mt-2">Khám phá tất cả sản phẩm</Link></div>
  return <div><div className={GRID}>{items.map((p,i)=><ProductCard key={p.id} p={p} typeName={typeNames[p.type_id]} priority={i<2} className={i>=initial.items.length?'card-in':undefined}/>)}{isFetchingNextPage?Array.from({length:4},(_,i)=><ProductCardSkeleton key={`s${i}`}/>):null}</div><div ref={sentinel} className="h-px" aria-hidden="true"/><div className="shop-grid-footer" aria-live="polite">{isError?<><p>Chưa tải được phần tiếp theo. Các sản phẩm đã xem vẫn được giữ.</p><button type="button" className="btn btn-secondary" onClick={()=>void(hasNextPage?fetchNextPage():refetch())}>Thử tải lại</button></>:hasNextPage?<button type="button" className="btn btn-secondary" disabled={isFetchingNextPage} onClick={()=>void fetchNextPage()}>{isFetchingNextPage?<Loader2 size={16} className="animate-spin" aria-hidden="true"/>:<ArrowDown size={16} aria-hidden="true"/>}{isFetchingNextPage?'Đang tải thêm…':'Xem thêm sản phẩm'}</button>:<p>Bạn đã xem tất cả {items.length} sản phẩm phù hợp.</p>}</div></div>
}
