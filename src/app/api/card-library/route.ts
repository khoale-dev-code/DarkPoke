import { NextResponse, type NextRequest } from 'next/server'
import { parseLibraryQuery } from '@/features/card-library/domain'
import { getLibraryPage } from '@/features/card-library/server/data'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const query = parseLibraryQuery(request.nextUrl.searchParams)
  try {
    const page = await getLibraryPage(query)
    return NextResponse.json(page, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=600' } })
  } catch {
    return NextResponse.json({ error: 'card_library_unavailable' }, {
      status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '15' }
    })
  }
}
