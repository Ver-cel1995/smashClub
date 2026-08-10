'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import {startProgress} from "@/store/route-progress";

/**
 * Router с автопрогрессом на push/replace/refresh/back/forward.
 * Использовать вместо useRouter() в любом клиентском компоненте,
 * где ты вручную вызываешь навигацию.
 */
export function useProgressRouter() {
    const router = useRouter()

    return useMemo(
        () => ({
            push: (href: string, options?: Parameters<typeof router.push>[1]) => {
                startProgress()
                router.push(href, options)
            },
            replace: (href: string, options?: Parameters<typeof router.replace>[1]) => {
                startProgress()
                router.replace(href, options)
            },
            refresh: () => {
                startProgress()
                router.refresh()
            },
            back: () => {
                startProgress()
                router.back()
            },
            forward: () => {
                startProgress()
                router.forward()
            },
            prefetch: router.prefetch.bind(router),
        }),
        [router]
    )
}