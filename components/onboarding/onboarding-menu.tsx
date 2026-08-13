'use client'

import { useProgressRouter } from '@/shared/hooks/use-progress-router'
import { useOnboarding } from '@/shared/onboarding/hooks/use-onboarding'
import {
    TOUR_LABEL,
    TOUR_DESCRIPTION,
    getMenuTours,
    type OnboardingProgress,
    type TourId,
} from '@/shared/onboarding/types'
import { buildGeneralPlayerTourSteps } from '@/shared/onboarding/tours/general-player-tour'
import { buildCoachPostsTourSteps } from '@/shared/onboarding/tours/coach-posts-tour'
import { buildCoachManagementTourSteps } from '@/shared/onboarding/tours/coach-management-tour'
import { buildCoachScheduleTourSteps } from '@/shared/onboarding/tours/coach-schedule-tour'
import { buildCoachTournamentsTourSteps } from '@/shared/onboarding/tours/coach-tournaments-tour'
import { ChevronRight, CheckCircle2, Play, Circle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type Props = {
    onboarding: OnboardingProgress | null
    isCoach: boolean
    userName: string
}

export function OnboardingMenu({ onboarding, isCoach, userName }: Props) {
    const router = useProgressRouter()
    const { resetAndLaunchOverview, resetAndLaunchInteractive } = useOnboarding()

    const navigate = (path: string) => router.push(path)
    const routerAdapter = { push: navigate }
    const returnPath = '/profile/settings/help'

    const visibleTourIds = getMenuTours(isCoach)

    const handleLaunch = async (tourId: TourId) => {
        switch (tourId) {
            case 'general_player': {
                const steps = buildGeneralPlayerTourSteps({
                    navigate,
                    userName,
                    returnPath,
                })
                await resetAndLaunchOverview(tourId, steps)
                break
            }
            case 'coach_posts': {
                const steps = buildCoachPostsTourSteps({ returnPath })
                await resetAndLaunchInteractive(tourId, steps, routerAdapter)
                break
            }
            case 'coach_management': {
                const steps = buildCoachManagementTourSteps({ returnPath })
                await resetAndLaunchInteractive(tourId, steps, routerAdapter)
                break
            }
            case 'coach_schedule': {
                const steps = buildCoachScheduleTourSteps({ returnPath })
                await resetAndLaunchInteractive(tourId, steps, routerAdapter)
                break
            }
            case 'coach_tournaments': {
                const steps = buildCoachTournamentsTourSteps({ returnPath })
                await resetAndLaunchInteractive(tourId, steps, routerAdapter)
                break
            }
        }
    }

    return (
        <div className="space-y-2">
            {visibleTourIds.map((tourId) => {
                const status = onboarding?.[tourId]
                const isCompleted = !!status?.completed_at
                const isSkipped = !!status?.skipped_at && !isCompleted

                return (
                    <button
                        key={tourId}
                        type="button"
                        onClick={() => handleLaunch(tourId)}
                        className="flex w-full items-start gap-3 rounded-2xl border border-card bg-card p-4 text-left transition-colors hover:border-strong hover:bg-hover"
                    >
                        <div
                            className={cn(
                                'shrink-0 rounded-full p-2',
                                isCompleted
                                    ? 'bg-success-muted text-success'
                                    : isSkipped
                                        ? 'bg-warning-muted text-warning'
                                        : 'bg-accent-muted text-accent'
                            )}
                        >
                            {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : isSkipped ? (
                                <Circle className="h-4 w-4" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-strong">
                                    {TOUR_LABEL[tourId]}
                                </p>
                                {isCompleted && (
                                    <span className="text-[10px] font-semibold uppercase text-success">
                                        Пройдено
                                    </span>
                                )}
                                {isSkipped && (
                                    <span className="text-[10px] font-semibold uppercase text-warning">
                                        Пропущено
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted">
                                {TOUR_DESCRIPTION[tourId]}
                            </p>
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted" />
                    </button>
                )
            })}

            <div className="mt-4 rounded-2xl border border-card bg-subtle p-4">
                <p className="text-xs text-muted">
                    💡 Экскурсию можно проходить сколько угодно раз. Она не мешает работе и её всегда можно закрыть крестиком.
                </p>
            </div>
        </div>
    )
}