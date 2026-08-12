'use client'

import { create } from 'zustand'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

type ProgressState = {
    active: boolean
    progress: number
    start: () => void
    done: () => void
    reset: () => void
}

/**
 * Global store for route progress bar.
 * Используйте startProgress() перед любым router.push / router.refresh / server action,
 * и он автоматически закроется когда URL сменится или вы вызовете doneProgress().
 */
export const useProgressStore = create<ProgressState>((set, get) => ({
    active: false,
    progress: 0,
    start: () => {
        if (get().active) return
        set({ active: true, progress: 15 })
    },
    done: () => {
        if (!get().active) return
        set({ progress: 100 })
        setTimeout(() => set({ active: false, progress: 0 }), 200)
    },
    reset: () => set({ active: false, progress: 0 }),
}))

// Публичные хелперы для вызова из любого места (в т.ч. вне React)
export const startProgress = () => useProgressStore.getState().start()
export const doneProgress = () => useProgressStore.getState().done()

export function RouteProgress() {
    const { active, progress } = useProgressStore()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Перехват кликов по <a>
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const link = target.closest('a')
            if (!link) return

            const href = link.getAttribute('href')
            if (
                !href ||
                href.startsWith('http') ||
                href.startsWith('#') ||
                href.startsWith('mailto:') ||
                href.startsWith('tel:') ||
                link.target === '_blank'
            ) {
                return
            }
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return

            startProgress()
        }
        document.addEventListener('click', onClick)
        return () => document.removeEventListener('click', onClick)
    }, [])

    // Плавный рост "жди-жди-жди"
    useEffect(() => {
        if (!active) return
        const t = setInterval(() => {
            useProgressStore.setState((s) => {
                if (!s.active || s.progress >= 85) return s
                return { ...s, progress: s.progress + Math.random() * 8 }
            })
        }, 200)
        return () => clearInterval(t)
    }, [active])

    // Закрытие при смене URL
    useEffect(() => {
        if (!active) return
        doneProgress()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams])

    if (!active) return null

    return (
        <div className="pointer-events-none fixed left-0 right-0 top-0 z-[9999] h-0.5 bg-transparent">
            <div
                className="h-full bg-[var(--accent-color,#a3e635)] shadow-[0_0_10px_var(--accent-glow,rgba(163,230,53,0.8))] transition-[width] duration-200 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    )
}