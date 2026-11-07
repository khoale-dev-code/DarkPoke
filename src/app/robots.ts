import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/pos', '/api', '/tai-khoan', '/don-hang', '/thanh-toan', '/auth'] }],
    sitemap: `${SITE_URL}/sitemap.xml`
  }
}
