import Link from 'next/link'
import { Users } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { getFirstName } from '@/shared/lib/formatName'
import { NotificationBell } from './notification-bell'
import type { UserRole } from '@/types'

type AppHeaderProps = {
    userName: string
    userAvatarUrl?: string | null
    role?: UserRole | 'guest'
}

export function AppHeader({ userName, userAvatarUrl, role = 'guest' }: AppHeaderProps) {
    const isCoach = role === 'coach' || role === 'development'
    const isPlayer = role === 'player'
    const isGuest = role === 'guest'

    return (
        <header
            data-tour="app-header"
            className="sticky top-0 z-30 border-b border-subtle bg-app/95 backdrop-blur-md"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
                <Link href="/profile" prefetch className="flex items-center gap-3 group">
                    <UserAvatar name={userName || 'Гость'} avatarUrl={userAvatarUrl} size="md" />
                    <div>
                        <p className="text-xs text-muted">Привет,</p>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-strong group-hover:text-accent transition-colors">
                                {getFirstName(userName || 'Гость')} 👋
                            </p>

                            {isCoach && (
                                <span className="rounded-full border border-accent bg-accent-muted px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                                    Тренер
                                </span>
                            )}

                            {isPlayer && (
                                <span className="rounded-full border border-info-border bg-info-muted px-2 py-0.5 text-[10px] font-bold uppercase text-info">
                                    Игрок
                                </span>
                            )}

                            {isGuest && (
                                <span className="rounded-full border border-subtle bg-subtle px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
                                    Гость
                                </span>
                            )}
                        </div>
                    </div>
                </Link>

                <div className="flex items-center gap-1">
                    <Link
                        href="/people"
                        className="rounded-xl p-2 text-muted hover:bg-hover hover:text-strong transition-colors"
                        aria-label="Люди"
                    >
                        <Users className="h-5 w-5" />
                    </Link>

                    <NotificationBell />
                </div>
            </div>
        </header>
    )
}