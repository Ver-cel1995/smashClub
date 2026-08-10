import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import {ReactNode} from "react";

export const metadata: Metadata = {
  title: 'SmashClub',
  description: 'Приложение для бадминтонного клуба',
    icons: '/favicon.svg',
    manifest: '/manifest.json',
    // iOS PWA
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'SmashClub',
    },
    // off автоопределение телефонов, дат — iOS их подчёркивает
    formatDetection: {
        telephone: false,
        date: false,
        email: false,
        address: false,
    },
}

export const viewport: Viewport = {
    themeColor: '#0a0a0a',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    // iOS PWA — учитывает "чёлку"
    viewportFit: 'cover',
}

export default function RootLayout({children}: {children: ReactNode}) {
  return (
      <html lang="ru" className="dark">
      <head>
          {/* iOS splash screens (опционально, но улучшает восприятие) */}
          <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-neutral-100 text-slate-900 antialiased">
      {children}
      <Toaster
          theme="dark"
          position="top-center"
          richColors
          toastOptions={{
              style: {
                  background: 'rgb(23 23 23)',
                  border: '1px solid rgb(64 64 64)',
                  color: 'rgb(245 245 245)',
              },
          }}
          offset={70}
      />
      </body>
      </html>
  )
}