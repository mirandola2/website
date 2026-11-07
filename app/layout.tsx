import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Roboto, Roboto_Slab, Roboto_Serif, Caprasimo } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import OfflineBanner from '@/components/OfflineBanner'
import PwaRegister from '@/components/PwaRegister'
import { ICONS_VERSION } from '@/lib/pwa'
import './globals.css'

const roboto = Roboto({
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-roboto',
})

const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  variable: '--font-roboto-slab',
})

const caprasimo = Caprasimo({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-caprasimo',
})

const robotoSerif = Roboto_Serif({
  weight: '400',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-roboto-serif',
  // Only used by quotes/blockquotes: don't compete with the hero image for bandwidth
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL('https://mirandola2.it'),
  title: {
    default: 'AGESCI Scout Mirandola 2 ~ Da più di 40 anni facciamo giochi, avventure e strade.',
    template: '%s ~ Scout Mirandola 2',
  },
  description: 'Siamo a Mirandola dal 1983: scopri le ultime notizie, la nostra storia, i nostri staff, i nomi totem, la galleria foto e video e una raccolta di strumenti utili.',
  icons: {
    icon: '/favicon.ico',
    apple: `/icons/apple-touch-icon.png?v=${ICONS_VERSION}`,
  },
  appleWebApp: { capable: true, title: 'Mirandola 2', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#462678',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it" className={`${roboto.variable} ${robotoSlab.variable} ${caprasimo.variable} ${robotoSerif.variable}`}>
      <head>
        <link rel="preconnect" href="https://ik.imagekit.io" />
      </head>
      <body>
        <Header>
          <main className="flex-1">{children}</main>
          <Footer />
        </Header>
        <OfflineBanner />
        <PwaRegister />
        <Analytics />
      </body>
    </html>
  )
}
