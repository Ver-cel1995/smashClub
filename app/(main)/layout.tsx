import { getCurrentUser } from '@/shared/lib/auth'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ReactNode } from 'react'
import { TabsPrefetcher } from '@/components/layout/tabs-prefetcher'
import { ConfirmProvider } from '@/shared/lib/confirm/confirm-context'
import { RouteProgress } from '@/store/route-progress'
import { GenderRequiredModal } from '@/components/onboarding/gender-required-modal'
import { TourLauncher } from '@/components/onboarding/tour-launcher'
import type { OnboardingProgress } from '@/shared/onboarding/types'

export default async function MainLayout({ children }: { children: ReactNode }) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    const needsGender = !user.profile.gender
    const onboarding = (user.profile.onboarding ?? {}) as OnboardingProgress
    const isCoach = user.profile.role === 'coach'
    const userName = (user.profile.full_name ?? 'Игрок').trim().split(/\s+/)[0]

    return (
        <ConfirmProvider>
            <RouteProgress />
            <div className="min-h-screen bg-app" data-tour="app-shell">
                <AppHeader
                    userName={user.profile.full_name}
                    userAvatarUrl={user.profile.avatar_url}
                    isCoach={isCoach}
                />
                <main className="mx-auto max-w-md pb-24">
                    {children}
                </main>
                <TabsPrefetcher />
                <BottomNav />
            </div>

            {needsGender && <GenderRequiredModal />}

            {/* TourLauncher — автозапуск тура при первом входе.
                Запускается только если gender уже задан */}
            {!needsGender && (
                <TourLauncher
                    onboarding={onboarding}
                    isCoach={isCoach}
                    userName={userName}
                />
            )}
        </ConfirmProvider>
    )
}