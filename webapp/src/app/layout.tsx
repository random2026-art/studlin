import type { Metadata } from 'next'
import { Caveat, Instrument_Serif, JetBrains_Mono, Geist } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-caveat',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
})

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

export const metadata: Metadata = {
  title: 'Studlin — Your Study OS',
  description: 'Writing tools, smart scheduling, AI tutoring, flashcards, focus mode and gamified streaks — all in one calm command center.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${caveat.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${geist.variable} h-full`}
    >
      <body className="h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
