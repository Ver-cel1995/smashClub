import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import {ReactNode} from "react";

export const metadata: Metadata = {
  title: 'SmashClub',
  description: 'Приложение для бадминтонного клуба',
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({children}: {children: ReactNode}) {
  return (
      <html lang="ru" className="dark">
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