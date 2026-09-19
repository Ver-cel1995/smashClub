import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist } from 'serwist'

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
        {
            matcher: ({ request }) => request.mode === 'navigate',
            handler: new NetworkFirst({
                cacheName: 'pages',
                networkTimeoutSeconds: 3,
                plugins: [new ExpirationPlugin({ maxEntries: 50 })],
            }),
        },
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