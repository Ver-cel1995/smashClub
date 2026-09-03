import { getCurrentUser } from '@/shared/lib/auth'
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

    // Данные для зарегистрированного или гостя
    const isGuest = !user
    const needsGender = !isGuest && !user?.profile?.gender
    const onboarding = (user?.profile?.onboarding ?? {}) as OnboardingProgress
    const isCoach = user?.profile?.role === 'coach' || user?.profile?.role === 'development'
    const userName = user?.profile?.full_name ?? 'Гость'
    const firstName = (userName ?? 'Игрок').trim().split(/\s+/)[0]
    const userRole = user?.profile?.role ?? 'guest'

    return (
        <ConfirmProvider>
            <RouteProgress />
            <div className="min-h-screen bg-app" data-tour="app-shell">
                <AppHeader
                    userName={userName}
                    userAvatarUrl={user?.profile?.avatar_url ?? null}
                    role={userRole}
                />
                <main className="mx-auto max-w-md pb-24">
                    {children}
                </main>
                <TabsPrefetcher />
                <BottomNav />
            </div>

            {/* Модалка указания пола только для авторизованных */}
            {!isGuest && needsGender && <GenderRequiredModal />}

            {/* Автозапуск туров онбординга только для авторизованных */}
            {!isGuest && !needsGender && (
                <TourLauncher
                    onboarding={onboarding}
                    isCoach={isCoach}
                    userName={firstName}
                />
            )}
        </ConfirmProvider>
    )
}