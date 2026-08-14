'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/shared/lib/utils'
import { UserAvatar } from '@/components/user-avatar'
import type { TrainingAttendee } from '@/app/(main)/schedule/queries'

type PlayerLite = {
    id: string
    full_name: string
    avatar_url: string | null
    role: string
}

type Props = {
    attendance: TrainingAttendee[]
    allPlayers: PlayerLite[]
    currentUserId: string
}

type Tab = 'going' | 'not_going' | 'no_response'

export function TrainingAttendanceLists({ attendance, allPlayers, currentUserId }: Props) {
    const [tab, setTab] = useState<Tab>('going')

    const { going, notGoing, noResponse } = useMemo(() => {
        const respondedIds = new Set(attendance.map((a) => a.player.id))
        const going = attendance.filter((a) => a.status === 'going')
        const notGoing = attendance.filter((a) => a.status === 'not_going')
        // "Не ответили" = все игроки, которых нет в attendance
        const noResponse = allPlayers.filter((p) => !respondedIds.has(p.id))

        return { going, notGoing, noResponse }
    }, [attendance, allPlayers])

    const tabs: Array<{ id: Tab; label: string; count: number }> = [
        { id: 'going', label: 'Придут', count: going.length },
        { id: 'not_going', label: 'Не придут', count: notGoing.length },
        { id: 'no_response', label: 'Не ответили', count: noResponse.length },
    ]

    const currentList: PlayerLite[] =
        tab === 'going'
            ? going.map((a) => a.player)
            : tab === 'not_going'
                ? notGoing.map((a) => a.player)
                : noResponse

    return (
        <div className="space-y-3 rounded-2xl border border-card bg-card p-4">
            {/* Табы */}
            <div className="flex gap-1 rounded-xl bg-subtle p-1">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={cn(
                            'flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors',
                            tab === t.id
                                ? 'bg-card text-strong shadow-sm'
                                : 'text-muted hover:text-strong'
                        )}
                    >
                        {t.label}
                        <span className="ml-1 opacity-70">({t.count})</span>
                    </button>
                ))}
            </div>

            {/* Список */}
            {currentList.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">Пусто</p>
            ) : (
                <div className="space-y-1.5">
                    {currentList.map((player) => (
                        <div
                            key={player.id}
                            className={cn(
                                'flex items-center gap-2 rounded-xl p-2',
                                player.id === currentUserId ? 'bg-accent-muted' : 'bg-subtle'
                            )}
                        >
                            <UserAvatar
                                name={player.full_name}
                                avatarUrl={player.avatar_url}
                                size="sm"
                            />
                            <span className="flex-1 truncate text-sm font-medium text-main">
                                {player.full_name}
                                {player.id === currentUserId && (
                                    <span className="ml-1 text-accent">(ты)</span>
                                )}
                            </span>
                            {player.role === 'coach' && (
                                <span className="text-[10px] font-semibold uppercase text-accent">
                                    Тренер
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}