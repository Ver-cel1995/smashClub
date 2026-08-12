import { getCurrentUser } from '@/shared/lib/auth'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ReactNode } from 'react'
import { TabsPrefetcher } from '@/components/layout/tabs-prefetcher'
import { ConfirmProvider } from '@/shared/lib/confirm/confirm-context'
import { RouteProgress } from '@/store/route-progress'

export default async function MainLayout({ children }: { children: ReactNode }) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

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
        </ConfirmProvider>
    )
}