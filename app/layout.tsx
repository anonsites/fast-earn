import { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://fast-earn.vercel.app'),
  title: {
    default: 'Fast Earn - Advertising Reward Platform',
    template: '%s | Fast Earn',
  },
  description: 'Make money online by sharing ads with your friends. Fast Earn is a platform that rewards you for promoting products and services. Join now and start earning!',
  keywords: ['earn money', 'online rewards', 'watch videos', 'complete tasks', 'rwanda', 'mobile money', 'work from home'],
  authors: [{ name: 'Fast Earn Team' }],
  creator: 'Fast Earn',
  publisher: 'Fast Earn',
  openGraph: {
    title: 'Fast Earn - Advertising Reward Platform',
    description: 'Make money online by sharing ads with your friends. Join now and start earning!',
    url: 'https://fast-earn.vercel.app',
    siteName: 'Fast Earn',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fast Earn',
    description: 'Make money online by sharing ads with your friends.',
    creator: '@fastearn',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white antialiased">{children}</body>
    </html>
  )
}