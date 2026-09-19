import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'
import withBundleAnalyzerInit from '@next/bundle-analyzer'

const supabaseHost = (() => {
    try {
        return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname
    } catch {
        return 'localhost'
    }
})()

const withBundleAnalyzer = withBundleAnalyzerInit({
    enabled: process.env.ANALYZE === 'true',
})

const withSerwist = withSerwistInit({
    swSrc: 'app/sw.ts',
    swDest: 'public/sw.js',
    cacheOnNavigation: true,
    reloadOnOnline: true,
    disable: process.env.NODE_ENV !== 'production',
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
        qualities: [75],
        minimumCacheTTL: 31536000,
    },

    compress: true,
    poweredByHeader: false,

    experimental: {
        serverActions: {
            bodySizeLimit: '20mb',
        },
        optimizePackageImports: [
            'lucide-react',
            'date-fns',
            'sonner',
            'lottie-react',
            'radix-ui',
            '@supabase/ssr',
            '@supabase/supabase-js',
            'zod',
        ],
    },

    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico)',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
            {
                source: '/sw.js',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
                ],
            },
        ]
    },
}

export default withBundleAnalyzer(withSerwist(nextConfig))