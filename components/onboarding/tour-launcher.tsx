'use client'

import { useEffect, useRef, useState } from 'react'
import { useOnboarding } from '@/shared/onboarding/hooks/use-onboarding'
import { buildGeneralPlayerTourSteps } from '@/shared/onboarding/tours/general-player-tour'
import { buildCoachPostsTourSteps } from '@/shared/onboarding/tours/coach-posts-tour'
import { buildCoachManagementTourSteps } from '@/shared/onboarding/tours/coach-management-tour'
import { buildCoachScheduleTourSteps } from '@/shared/onboarding/tours/coach-schedule-tour'
import { buildCoachTournamentsTourSteps } from '@/shared/onboarding/tours/coach-tournaments-tour'
import {
    shouldShowTour,
    getAutoLaunchTours,
    type OnboardingProgress,
    type TourId,
} from '@/shared/onboarding/types'
import { useProgressRouter } from '@/shared/hooks/use-progress-router'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

type Props = {
    onboarding: OnboardingProgress | null
    isCoach: boolean
    userName: string
}

/**
 * TourLauncher — автозапуск туров при первом входе.
 *
 * Логика:
 *   1. Проверяем какие туры нужно показать (getAutoLaunchTours + shouldShowTour)
 *   2. Если есть хотя бы один непройденный — показываем приветственную модалку
 *   3. Пользователь: "Начать" → запускаем цепочку туров; "Позже" → откладываем
 *   4. Цепочка запускается по одному — каждый следующий после завершения предыдущего
 */
export function TourLauncher({ onboarding, isCoach, userName }: Props) {
    const router = useProgressRouter()
    const { launchTour, launchInteractiveTour } = useOnboarding()
    const shownRef = useRef(false)
    const [welcomeOpen, setWelcomeOpen] = useState(false)
    const [queueToRun, setQueueToRun] = useState<TourId[]>([])

    // При маунте — проверяем нужно ли показать приветствие
    useEffect(() => {
        if (shownRef.current) return

        const autoTours = getAutoLaunchTours(isCoach)
        const pending = autoTours.filter((id) => shouldShowTour(id, onboarding))

        if (pending.length > 0) {
            shownRef.current = true
            // Задержка чтобы DOM успел отрисоваться
            const timer = setTimeout(() => {
                setQueueToRun(pending)
                setWelcomeOpen(true)
            }, 700)
            return () => clearTimeout(timer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Запуск цепочки туров
    const runQueue = (queue: TourId[]) => {
        if (queue.length === 0) return

        const [current, ...rest] = queue
        const returnPath = '/home'
        const navigate = (path: string) => router.push(path)
        const routerAdapter = { push: navigate }

        const continueChain = () => {
            if (rest.length > 0) {
                // Небольшая задержка между турами
                setTimeout(() => runQueue(rest), 500)
            }
        }

        switch (current) {
            case 'general_player': {
                const steps = buildGeneralPlayerTourSteps({
                    navigate,
                    userName,
                    returnPath,
                })
                launchTour(current, steps, {
                    onCompleteExtra: continueChain,
                    onSkipExtra: continueChain,
                })
                break
            }
            case 'coach_posts': {
                const steps = buildCoachPostsTourSteps({ returnPath })
                launchInteractiveTour(current, steps, routerAdapter, {
                    onCompleteExtra: continueChain,
                    onSkipExtra: continueChain,
                })
                break
            }
            case 'coach_management': {
                const steps = buildCoachManagementTourSteps({ returnPath })
                launchInteractiveTour(current, steps, routerAdapter, {
                    onCompleteExtra: continueChain,
                    onSkipExtra: continueChain,
                })
                break
            }
            case 'coach_schedule': {
                const steps = buildCoachScheduleTourSteps({ returnPath })
                launchInteractiveTour(current, steps, routerAdapter, {
                    onCompleteExtra: continueChain,
                    onSkipExtra: continueChain,
                })
                break
            }
            case 'coach_tournaments': {
                const steps = buildCoachTournamentsTourSteps({ returnPath })
                launchInteractiveTour(current, steps, routerAdapter, {
                    onCompleteExtra: continueChain,
                    onSkipExtra: continueChain,
                })
                break
            }
        }
    }

    const handleStart = () => {
        setWelcomeOpen(false)
        // Небольшая задержка чтобы модалка закрылась плавно
        setTimeout(() => runQueue(queueToRun), 300)
    }

    const handleLater = () => {
        setWelcomeOpen(false)
        // НЕ помечаем туры пропущенными — просто откладываем.
        // При следующем перезаходе снова покажется приветствие.
        // Юзер может пройти в Настройки → Помощь когда захочет.
    }

    if (!welcomeOpen) return null

    const totalTours = queueToRun.length
    const isCoachFlow = isCoach && queueToRun.some((id) => id.startsWith('coach_'))

    return (
        <Dialog open={welcomeOpen} onOpenChange={() => { /* нельзя закрыть кликом вне */ }}>
            <DialogContent
                className="border-card bg-elevated sm:max-w-sm"
                hideCloseButton
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <div className="flex justify-center">
                    <div className="rounded-full bg-accent-muted p-3">
                        <Sparkles className="h-6 w-6 text-accent" />
                    </div>
                </div>

                <DialogTitle className="text-center text-lg font-bold text-strong">
                    {isCoachFlow
                        ? `Привет, ${userName}! 👋`
                        : `Привет, ${userName}! 👋`}
                </DialogTitle>

                <p className="text-center text-sm text-muted">
                    {isCoachFlow ? (
                        <>
                            Ты <b>тренер</b>, у тебя есть особые возможности. Проведу короткую экскурсию по управлению — это <b>{totalTours} мини-тура</b> подряд. Всё можно пропустить в любой момент.
                        </>
                    ) : (
                        <>
                            Это <b>SmashClub</b> — приложение нашего клуба. Пройдём короткую экскурсию, чтобы ты сразу понял что где находится. Займёт всего пару минут.
                        </>
                    )}
                </p>

                <div className="rounded-xl bg-subtle p-3">
                    <p className="text-xs text-muted text-center">
                        💡 Экскурсию всегда можно повторить в <b>Настройки → Помощь</b>
                    </p>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                    <Button variant="secondary" fullWidth onClick={handleStart}>
                        {isCoachFlow ? 'Начать обучение →' : 'Начать экскурсию →'}
                    </Button>
                    <Button variant="ghost" fullWidth onClick={handleLater}>
                        Позже
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}