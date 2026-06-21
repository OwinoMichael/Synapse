import type { Metadata } from 'next'
import { IBM_Plex_Mono, DM_Sans, Fraunces } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Synapse — Prediction Market Intelligence',
  description: 'Real-time AI that detects when prediction markets are lying.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${ibmPlexMono.variable} ${fraunces.variable}`}>
      <body
        style={{
          backgroundColor: '#032425',
          color: '#E8F5F5',
          fontFamily: 'var(--font-sans), DM Sans, system-ui, sans-serif',
          fontSize: '14px',
          lineHeight: '1.6',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  )
}