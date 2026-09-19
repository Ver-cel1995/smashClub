import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SmashClub',
        short_name: 'SmashClub',
        description: 'Клуб бадминтона Кущёвская',
        id: '/home',
        start_url: '/home',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone'],
        orientation: 'portrait',
        background_color: '#0f131d',
        theme_color: '#0f131d',
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
            { name: 'Расписание', url: '/schedule' },
            { name: 'Лента', url: '/feed' },
            { name: 'Турниры', url: '/tournaments' },
        ],
    }
}