import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getCurrentUser } from '@/shared/lib/auth'
import { SettingsForm } from '@/components/profile/settings-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    return (
        <div className="flex flex-col gap-3 p-4 pb-24">
            <Link
                href="/profile"
                className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white"
            >
                <ChevronLeft className="h-4 w-4" />
                Профиль
            </Link>

            <h1 className="text-xl font-bold text-white">Настройки</h1>

            <SettingsForm profile={user.profile} />
        </div>
    )
}