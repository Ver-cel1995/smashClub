import { getCurrentUser } from '@/shared/lib/auth'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav } from '@/components/layout/bottom-nav'
import {ReactNode} from "react";
import {TabsPrefetcher} from "@/components/layout/tabs-prefetcher";

export default async function MainLayout({children}: { children: ReactNode }) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-neutral-950">
            <AppHeader
                userName={user.profile.full_name}
                userAvatarUrl={user.profile.avatar_url}
                isCoach={user.profile.role === 'coach'}
            />

            {/* Основной контент */}
            <main className="mx-auto max-w-md pb-24">
                {/* pb-24 = отступ снизу под bottom nav */}
                {children}
            </main>
            <TabsPrefetcher />
            <BottomNav />
        </div>
    )
}