import { NextResponse, type NextRequest } from 'next/server'
import { listProducts } from '@/lib/catalog'
import { parseProductQuery } from '@/lib/query'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const q = parseProductQuery(sp)
  try {
    const page = await listProducts({ ...q, cursor: sp.get('cursor'), limit: 12 })
    return NextResponse.json(page, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
  } catch {
    return NextResponse.json({ error: 'load_failed' }, { status: 500 })
  }
}
