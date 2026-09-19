import { Suspense } from 'react'
import { ReactNode } from 'react'
import { getCurrentUser } from '@/shared/lib/auth'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ConfirmProvider } from '@/shared/lib/confirm/confirm-context'
import { RouteProgress } from '@/store/route-progress'
import { GenderRequiredModal } from '@/components/onboarding/gender-required-modal'
import { TourLauncherLazy } from '@/components/onboarding/tour-launcher-lazy'
import type { OnboardingProgress } from '@/shared/onboarding/types'
import { MaxBridge } from '@/components/auth/max-bridge'

export default async function MainLayout({ children }: { children: ReactNode }) {
    const user = await getCurrentUser()

    const isGuest = !user
    const needsGender = !isGuest && !user?.profile?.gender
    const onboarding = (user?.profile?.onboarding ?? {}) as OnboardingProgress
    const isCoach = user?.profile?.role === 'coach' || user?.profile?.role === 'development'
    const userName = user?.profile?.full_name ?? 'Гость'
    const firstName = userName.trim().split(/\s+/)[0]
    const userRole = user?.profile?.role ?? 'guest'

    return (
        <ConfirmProvider>
            <Suspense fallback={null}>
                <RouteProgress />
            </Suspense>

            <div className="min-h-screen bg-app" data-tour="app-shell">
                <AppHeader
                    userName={userName}
                    userAvatarUrl={user?.profile?.avatar_url ?? null}
                    role={userRole}
                />
                <main className="mx-auto max-w-md pb-24">{children}</main>
                <BottomNav />
            </div>

            {!isGuest && needsGender && <GenderRequiredModal />}

            {!isGuest && !needsGender && (
                <TourLauncherLazy onboarding={onboarding} isCoach={isCoach} userName={firstName} />
            )}

            <MaxBridge />
        </ConfirmProvider>
    )
}