import type { NextConfig } from 'next'
import withPWAInit from '@ducanh2912/next-pwa'
import withBundleAnalyzerInit from '@next/bundle-analyzer'

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname

const withBundleAnalyzer = withBundleAnalyzerInit({
    enabled: process.env.ANALYZE === 'true',
})

const withPWA = withPWAInit({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    workboxOptions: {
        skipWaiting: true,
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'supabase-api',
                    networkTimeoutSeconds: 5,
                    expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 60 * 5,
                    },
                },
            },
            {
                urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/.*/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'supabase-storage',
                    expiration: {
                        maxEntries: 500,
                        maxAgeSeconds: 60 * 60 * 24 * 30,
                    },
                },
            },
            {
                urlPattern: /\/_next\/static\/.+/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'next-static',
                    expiration: {
                        maxEntries: 200,
                        maxAgeSeconds: 60 * 60 * 24 * 365,
                    },
                },
            },
            {
                urlPattern: /\/_next\/image\?.*/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'next-images',
                    expiration: {
                        maxEntries: 200,
                        maxAgeSeconds: 60 * 60 * 24 * 30,
                    },
                },
            },
            {
                urlPattern: /\.(?:woff2|ttf|otf)$/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'fonts',
                    expiration: {
                        maxEntries: 20,
                        maxAgeSeconds: 60 * 60 * 24 * 365,
                    },
                },
            },
        ],
    },
})

const nextConfig: NextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: supabaseHost,
                pathname: '/storage/v1/object/public/**',
            },
        ],
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [360, 640, 768, 1024, 1280],
        imageSizes: [64, 128, 256],
        minimumCacheTTL: 31536000,
    },

    compress: true,
    poweredByHeader: false,

    experimental: {
        serverActions: {
            bodySizeLimit: "20mb",
        },
        optimizePackageImports: [
            'lucide-react',
            'date-fns',
            'sonner',
            'lottie-react',
            '@supabase/ssr',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
        ],
    },

    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/manifest.json',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=3600',
                    },
                ],
            },
        ]
    },
}

export default withBundleAnalyzer(withPWA(nextConfig))