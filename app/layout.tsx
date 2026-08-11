import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { ReactNode } from 'react'
import { ThemeProvider } from '@/shared/lib/theme/theme-provider'

export const metadata: Metadata = {
    title: 'SmashClub',
    description: 'Клуб бадминтона Кущёвская',
    manifest: '/manifest.json',
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
        ],
        apple: '/apple-touch-icon.png',
    },
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
    themeColor: '#0f131d',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    // iOS PWA — учитывает "чёлку"
    viewportFit: 'cover',
}

const themeScript = `
(function() {
  try {
    var savedTheme = localStorage.getItem('smashclub-theme-mode') || 'dark';
    var savedAccent = localStorage.getItem('smashclub-accent-color') || 'lime';
    var root = document.documentElement;
    
    root.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }

    var accents = {
      lime: { hex: '#a3e635', hover: '#84cc16', glow: 'rgba(163,230,53,0.4)', fg: '#09090b', muted: 'rgba(163,230,53,0.12)', border: 'rgba(163,230,53,0.3)' },
      emerald: { hex: '#34d399', hover: '#10b981', glow: 'rgba(52,211,153,0.4)', fg: '#09090b', muted: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' },
      sky: { hex: '#38bdf8', hover: '#0ea5e9', glow: 'rgba(56,189,248,0.4)', fg: '#09090b', muted: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)' },
      violet: { hex: '#a78bfa', hover: '#8b5cf6', glow: 'rgba(167,139,250,0.4)', fg: '#ffffff', muted: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)' },
      rose: { hex: '#fb7185', hover: '#f43f5e', glow: 'rgba(251,113,133,0.4)', fg: '#ffffff', muted: 'rgba(251,113,133,0.15)', border: 'rgba(251,113,133,0.3)' },
      amber: { hex: '#fbbf24', hover: '#f59e0b', glow: 'rgba(251,191,36,0.4)', fg: '#09090b', muted: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
      cyan: { hex: '#22d3ee', hover: '#06b6d4', glow: 'rgba(34,211,238,0.4)', fg: '#09090b', muted: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.3)' },
      indigo: { hex: '#818cf8', hover: '#6366f1', glow: 'rgba(129,140,248,0.4)', fg: '#ffffff', muted: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.3)' }
    };

    var acc = accents[savedAccent] || accents.lime;
    root.setAttribute('data-accent', savedAccent);
    root.style.setProperty('--accent-color', acc.hex);
    root.style.setProperty('--accent-hover', acc.hover);
    root.style.setProperty('--accent-glow', acc.glow);
    root.style.setProperty('--accent-foreground', acc.fg);
    root.style.setProperty('--accent-muted', acc.muted);
    root.style.setProperty('--accent-border', acc.border);
  } catch (e) {}
})();
`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
      <html lang="ru" className="dark" suppressHydrationWarning>
      <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-[var(--bg-main)] text-[var(--text-main)] antialiased">
      <ThemeProvider>
          {children}
          <Toaster
              theme="dark"
              position="top-center"
              richColors
              toastOptions={{
              style: {
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
              },
              }}
              offset={70}
          />
      </ThemeProvider>
      </body>
      </html>
  )
}