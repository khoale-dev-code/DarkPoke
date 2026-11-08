import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dark Poke',
    short_name: 'Dark Poke',
    description: 'Thẻ bài TCG chính hãng. Hunt - Trade - Collect.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1b4fe0',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcuts: [
      { name: 'Quản trị', url: '/admin' },
      { name: 'Bán tại quầy', url: '/pos' }
    ]
  }
}
