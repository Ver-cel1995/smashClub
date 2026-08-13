'use client'

import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
    startTour,
    startInteractiveTour,
    type TourConfig,
    type InteractiveTourConfig,
} from '../driver'
import type { TourId } from '../types'
import {
    markTourCompleted,
    markTourSkipped,
    resetTour,
} from '@/app/(main)/profile/actions'

export function useOnboarding() {
    const activeDriverRef = useRef<ReturnType<typeof startTour> | null>(null)

    /**
     * Запустить обзорный тур (для игрока).
     */
    const launchTour = useCallback(
        (
            tourId: TourId,
            steps: TourConfig['steps'],
            options?: {
                onCompleteExtra?: () => void
                onSkipExtra?: () => void
            }
        ) => {
            if (activeDriverRef.current) {
                activeDriverRef.current.destroy()
                activeDriverRef.current = null
            }

            const instance = startTour({
                steps,
                showProgress: true,
                onComplete: async () => {
                    const result = await markTourCompleted(tourId)
                    if (!result.success) {
                        console.error('Failed to mark tour completed:', result.error)
                    }
                    options?.onCompleteExtra?.()
                    activeDriverRef.current = null
                },
                onSkip: async () => {
                    const result = await markTourSkipped(tourId)
                    if (!result.success) {
                        console.error('Failed to mark tour skipped:', result.error)
                    }
                    options?.onSkipExtra?.()
                    activeDriverRef.current = null
                },
            })

            activeDriverRef.current = instance
        },
        []
    )

    /**
     * Запустить интерактивный тур (для тренера — с ожиданием реальных кликов).
     */
    const launchInteractiveTour = useCallback(
        (
            tourId: TourId,
            steps: InteractiveTourConfig['steps'],
            router: InteractiveTourConfig['router'],
            options?: {
                onCompleteExtra?: () => void
                onSkipExtra?: () => void
            }
        ) => {
            if (activeDriverRef.current) {
                activeDriverRef.current.destroy()
                activeDriverRef.current = null
            }

            const instance = startInteractiveTour({
                steps,
                router,
                onComplete: async () => {
                    const result = await markTourCompleted(tourId)
                    if (!result.success) {
                        console.error('Failed to mark tour completed:', result.error)
                    }
                    options?.onCompleteExtra?.()
                    activeDriverRef.current = null
                },
                onSkip: async () => {
                    const result = await markTourSkipped(tourId)
                    if (!result.success) {
                        console.error('Failed to mark tour skipped:', result.error)
                    }
                    options?.onSkipExtra?.()
                    activeDriverRef.current = null
                },
            })

            activeDriverRef.current = instance
        },
        []
    )

    /**
     * Сбросить и запустить обзорный тур (для меню Помощь).
     */
    const resetAndLaunchOverview = useCallback(
        async (tourId: TourId, steps: TourConfig['steps']) => {
            const reset = await resetTour(tourId)
            if (!reset.success) {
                toast.error(reset.error || 'Не удалось перезапустить тур')
                return
            }
            launchTour(tourId, steps)
        },
        [launchTour]
    )

    /**
     * Сбросить и запустить интерактивный тур (для меню Помощь).
     */
    const resetAndLaunchInteractive = useCallback(
        async (
            tourId: TourId,
            steps: InteractiveTourConfig['steps'],
            router: InteractiveTourConfig['router']
        ) => {
            const reset = await resetTour(tourId)
            if (!reset.success) {
                toast.error(reset.error || 'Не удалось перезапустить тур')
                return
            }
            launchInteractiveTour(tourId, steps, router)
        },
        [launchInteractiveTour]
    )

    const stopTour = useCallback(() => {
        if (activeDriverRef.current) {
            activeDriverRef.current.destroy()
            activeDriverRef.current = null
        }
    }, [])

    return {
        launchTour,
        launchInteractiveTour,
        resetAndLaunchOverview,
        resetAndLaunchInteractive,
        stopTour,
    }
}