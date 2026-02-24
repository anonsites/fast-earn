import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fast Earn',
    short_name: 'FastEarn',
    description: 'Make money online by watching videos and completing tasks.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/icon',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}