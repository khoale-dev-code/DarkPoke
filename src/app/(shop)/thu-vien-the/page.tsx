import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LibraryList } from '@/features/card-library/components/library-list'
import { libraryHref, parseLibraryQuery } from '@/features/card-library/domain'
export const metadata:Metadata={title:'Thư viện thẻ Pokémon · TCGdex',description:'Tra cứu thẻ Pokémon TCG theo tên, mã thẻ, bộ thẻ và ngôn ngữ với dữ liệu TCGdex.',robots:{index:false,follow:true}}
export default async function CardLibraryPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const query = parseLibraryQuery(await searchParams)
  // Old bookmarked pagination URLs become the complete, continuous list.
  if (query.page > 1) redirect(libraryHref({ ...query, page: 1 }))
  return <LibraryList query={query}/>
}
