import { getCurrentUser } from '@/shared/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import { OnboardingMenu } from '@/components/onboarding/onboarding-menu'
import type { OnboardingProgress } from '@/shared/onboarding/types'

export default async function HelpPage() {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    const onboarding = (user.profile.onboarding ?? {}) as OnboardingProgress
    const isCoach = user.profile.role === 'coach'
    const userName = (user.profile.full_name ?? 'Игрок').trim().split(/\s+/)[0]

    return (
        <div className="space-y-4 p-4 pb-8">
            <Link
                href="/profile/settings"
                className="inline-flex items-center gap-2 text-sm text-muted hover:text-strong"
            >
                <ArrowLeft className="h-4 w-4" />
                Настройки
            </Link>

            <div className="flex items-center gap-3">
                <div className="rounded-full bg-accent-muted p-2">
                    <HelpCircle className="h-5 w-5 text-accent" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-strong">Помощь</h1>
                    <p className="text-sm text-muted mt-0.5">
                        Пройди интерактивную экскурсию по приложению
                    </p>
                </div>
            </div>

            <OnboardingMenu
                onboarding={onboarding}
                isCoach={isCoach}
                userName={userName}
            />
        </div>
    )
}