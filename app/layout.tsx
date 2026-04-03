import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Levee Breakers',
  description: 'Proven coaching and custom training for all ages and abilities. 1 mile to marathon.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Levee Breakers',
    description: 'Proven coaching and custom training for all ages and abilities. 1 mile to marathon.',
    url: 'https://leveebreakers.com',
    siteName: 'Levee Breakers',
    images: [
      {
        url: 'https://leveebreakers.com/og.jpg',  // 1200×630 image in /public
        width: 1200,
        height: 630,
        alt: 'Levee Breakers',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Levee Breakers',
    description: 'Proven coaching and custom training for all ages and abilities. 1 mile to marathon.',
    images: ['https://leveebreakers.com/og.jpg'],
  },
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  )
}
