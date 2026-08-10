'use client'

import {useEffect} from 'react'
import {useProgressRouter} from "@/shared/hooks/use-progress-router";

const routesToPrefetch = [
    '/home',
    '/feed',
    '/tournaments',
    '/schedule',
    '/profile',
    '/people',
]

type IdleWindow = Window & {
    requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions
    ) => number
    cancelIdleCallback?: (handle: number) => void
}

export function TabsPrefetcher() {
    const router = useProgressRouter()

    useEffect(() => {
        const w = window as IdleWindow

        const prefetchAll = () => {
            routesToPrefetch.forEach((route) => router.prefetch(route))
        }

        if (typeof w.requestIdleCallback === 'function') {
            const id = w.requestIdleCallback(() => prefetchAll(), { timeout: 2000 })

            return () => {
                if (typeof w.cancelIdleCallback === 'function') {
                    w.cancelIdleCallback(id)
                }
            }
        }

        const timeoutId = window.setTimeout(prefetchAll, 300)
        return () => window.clearTimeout(timeoutId)
    }, [router])

    return null
}