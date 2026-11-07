import { getHomeData } from '@/features/home/server/data'
import { HomeStorefront } from '@/features/home/components/storefront'

export const revalidate = 300

export default async function HomePage() {
  return <HomeStorefront data={await getHomeData()}/>
}
