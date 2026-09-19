import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { CacheFirst, ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from 'serwist'

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
    }
}

type SWScope = {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
    addEventListener: (type: string, listener: (event: never) => void) => void
    skipWaiting: () => Promise<void>
    clients: unknown
}

declare const self: SWScope

// Разделы с персональными/авторизованными данными — их НЕЛЬЗЯ кэшировать,
// иначе после сохранения (турнир, пол, регистрация) пользователь видит старую версию.
const DYNAMIC_PREFIXES = ['/tournaments', '/home', '/profile', '/schedule', '/feed']

function isDynamicPath(pathname: string): boolean {
    return DYNAMIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,

    fallbacks: {
        entries: [
            { url: '/offline', matcher: ({ request }) => request.destination === 'document' },
        ],
    },

    runtimeCaching: [
        // RSC-пейлоады динамических разделов — только сеть, без кэша.
        {
            matcher: ({ url }) => url.searchParams.has('_rsc') && isDynamicPath(url.pathname),
            handler: new NetworkOnly(),
        },
        // Навигации в динамические разделы — только сеть, без кэша.
        {
            matcher: ({ request, url }) =>
                request.mode === 'navigate' && isDynamicPath(url.pathname),
            handler: new NetworkOnly(),
        },

        // Остальные навигации (статичные страницы: /privacy, /terms, /login и т.п.) — кэшировать.
        {
            matcher: ({ request }) => request.mode === 'navigate',
            handler: new NetworkFirst({
                cacheName: 'pages',
                networkTimeoutSeconds: 3,
                plugins: [new ExpirationPlugin({ maxEntries: 50 })],
            }),
        },
        // Прочие RSC-пейлоады (статичные) — короткий кэш.
        {
            matcher: ({ url }) => url.searchParams.has('_rsc'),
            handler: new NetworkFirst({
                cacheName: 'rsc-payloads',
                networkTimeoutSeconds: 3,
                plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 3600 })],
            }),
        },
        {
            matcher: ({ url }) =>
                url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/storage/v1/'),
            handler: new CacheFirst({
                cacheName: 'supabase-storage',
                plugins: [new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 2592000 })],
            }),
        },
        ...defaultCache,
    ],
})

serwist.addEventListeners()