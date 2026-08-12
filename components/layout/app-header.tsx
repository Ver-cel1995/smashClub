'use client'

import Link from 'next/link'
import { Bell, Users } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { getFirstName } from '@/shared/lib/formatName'
import {toast} from "sonner";

type AppHeaderProps = {
    userName: string
    userAvatarUrl?: string | null
    isCoach?: boolean
    unreadCount?: number
}

export function AppHeader({
                              userName,
                              userAvatarUrl,
                              isCoach = false,
                              unreadCount = 0,
                          }: AppHeaderProps) {
    return (
        <header
            className="sticky top-0 z-30 border-subtle border/80 bg-neutral-950/98"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
                {/* Левая часть — аватар и приветствие */}
                <Link href="/profile" className="flex items-center gap-3">
                    <UserAvatar name={userName} avatarUrl={userAvatarUrl} size="md"/>
                    <div>
                        <p className="text-xs text-neutral-500">Привет,</p>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">
                                {getFirstName(userName)} 👋
                            </p>
                            {isCoach && (
                                <span className="rounded-full border border-accent bg-accent-muted px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
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
                        className="rounded-lg p-2 text-neutral-400 hover:bg-card hover:text-white transition-colors"
                        aria-label="Люди"
                    >
                        <Users className="h-5 w-5" />
                    </Link>

                    <button
                        type="button"
                        onClick={() => toast.info('Уведомления скоро появятся', { duration: 2000 })}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-300 transition hover:bg-neutral-800/60"
                        aria-label="Уведомления"
                    >
                        <Bell className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    )
}