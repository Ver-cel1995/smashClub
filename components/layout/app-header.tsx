'use client'

import Link from 'next/link'
import { Bell, Users } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { getFirstName } from '@/shared/lib/formatName'
import { toast } from "sonner"

interface AppHeaderProps {
    userName: string
    userAvatarUrl?: string | null
    isCoach?: boolean
    unreadCount?: number
}

export function AppHeader({
                              userName,
                              userAvatarUrl,
                              isCoach = false,
                              unreadCount = 2,
                          }: AppHeaderProps) {
    return (
        <header
            className="sticky top-0 z-30 border-b border-[var(--border-card)] bg-[var(--bg-card)]"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
                {/* Левая часть — аватар и приветствие */}
                <Link href="/profile" className="flex items-center gap-3">
                    <UserAvatar name={userName} avatarUrl={userAvatarUrl} size="md" />
                    <div>
                        <p className="text-xs text-[var(--text-muted)]">Добрый день</p>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-[var(--text-main)]">
                                Привет, {getFirstName(userName)} 👋
                            </p>
                            {isCoach && (
                                <span className="rounded-full border border-accent bg-accent-muted px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">
                                    Тренер
                                </span>
                            )}
                        </div>
                    </div>
                </Link>

                {/* Правая часть — иконки */}
                <div className="flex items-center gap-1">
                    <Link
                        href="/people"
                        className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-main)] transition-colors"
                        aria-label="Люди"
                    >
                        <Users className="h-5 w-5" />
                    </Link>

                    <button
                        type="button"
                        onClick={() => toast.info('У вас 2 новых уведомления', { duration: 2000 })}
                        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-main)] transition"
                        aria-label="Уведомления"
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-[var(--bg-card)]">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    )
}
