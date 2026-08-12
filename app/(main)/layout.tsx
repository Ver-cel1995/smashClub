import { getCurrentUser } from '@/shared/lib/auth'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ReactNode } from 'react'
import { TabsPrefetcher } from '@/components/layout/tabs-prefetcher'
import { ConfirmProvider } from '@/shared/lib/confirm/confirm-context'
import { RouteProgress } from '@/store/route-progress'
import { GenderRequiredModal } from '@/components/onboarding/gender-required-modal'

export default async function MainLayout({ children }: { children: ReactNode }) {
    const user = await getCurrentUser()

    console.log(user?.profile.gender)

    if (!user) {
        redirect('/login')
    }

    const needsGender = !user.profile.gender

    return (
        <ConfirmProvider>
            <RouteProgress />
            <div className="min-h-screen bg-app">
                <AppHeader
                    userName={user.profile.full_name}
                    userAvatarUrl={user.profile.avatar_url}
                    isCoach={user.profile.role === 'coach'}
                />
                <main className="mx-auto max-w-md pb-24">
                    {children}
                </main>
                <TabsPrefetcher />
                <BottomNav />
            </div>

            {needsGender && <GenderRequiredModal />}
        </ConfirmProvider>
    )
}