import type { Metadata } from 'next'
import { Newsreader, Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'

const editorial = Newsreader({
  subsets: ['latin'],
  variable: '--font-editorial',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-interface',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Daily Digest',
  description: 'Your personal AI research newspaper.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${editorial.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-white text-[#000000] font-sans antialiased">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
