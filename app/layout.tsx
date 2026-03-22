import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Arcanum - Официальный сайт',
  description: 'Интернет без границ и слежки. Один аккаунт — защита для всех ваших устройств.',
  generator: 'v0.app',
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
        <Script
          src="https://telegram.org/js/telegram-widget.js?22"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}