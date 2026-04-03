import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Levee Breakers',
  description: 'Levee Breakers offer coaching and custom training for all ages and abilities. 1 mile to marathon',
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
