'use client'

import Link from 'next/link'
import {AlertCircle, Calendar, Loader2, MapPin, Trophy, UserPlus} from 'lucide-react'
import {cn} from '@/shared/lib/utils'
import {formatDateRangeMouth} from '@/shared/lib/format'
import type {NextTournamentPayload} from '@/app/(main)/home/queries'
import {useProgressRouter} from '@/shared/hooks/use-progress-router'
import {useState} from 'react'

type Props = {
    tournament: NextTournamentPayload
}

export function NextTournamentCard({ tournament }: Props) {
    const router = useProgressRouter()
    const [isNavigating, setIsNavigating] = useState(false)

    const handleClick = (e: React.MouseEvent) => {
        if (isNavigating) return
        e.preventDefault()
        setIsNavigating(true)
        router.push(`/tournaments/${tournament.id}`)
    }

    // Определяем главный бейдж (приоритет: ongoing > pending > participating > looking > deadline)
    const badge = getMainBadge(tournament)

    // Форматируем взнос
    const feeText = tournament.has_entry_fee
        ? tournament.entry_fee_amount
            ? `${tournament.entry_fee_amount} ₽`
            : 'Взнос'
        : 'Без взноса'

    // Форматируем дедлайн регистрации
    const deadlineText = tournament.registration_deadline
        ? formatDeadline(tournament.registration_deadline)
        : null

    return (
        <Link
            href={`/tournaments/${tournament.id}`}
            onClick={handleClick}
            className={cn(
                'relative block overflow-hidden rounded-2xl transition-all',
                tournament.is_ongoing
                    ? 'border-accent bg-accent-muted shadow-accent animate-pulse-slow'
                    : 'border-card bg-card hover:border-strong',
                isNavigating && 'opacity-70 pointer-events-none'
            )}
        >
            {isNavigating && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                </div>
            )}

            {/* Верхний бейдж */}
            {badge && (
                <div
                    className={cn(
                        'flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider',
                        badge.className
                    )}
                >
                    {badge.icon}
                    <span>{badge.text}</span>
                </div>
            )}

            <div className="space-y-3 p-4">
                {/* Иконка + название */}
                <div className="flex items-start gap-2">
                    <div className="text-lg leading-none mt-0.5">
                        {tournament.tournament_type === 'home' ? '🏠' : '🚗'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-strong leading-snug line-clamp-2">
                            {tournament.title}
                        </h3>
                    </div>
                </div>

                {/* Дата + место */}
                <div className="space-y-1.5 text-xs text-muted">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatDateRangeMouth(tournament.start_date, tournament.end_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{tournament.city}</span>
                    </div>
                </div>

                {/* Взнос + дедлайн */}
                <div className="flex items-center gap-2 pt-1">
                    <span
                        className={cn(
                            'rounded-lg px-2 py-1 text-[11px] font-semibold',
                            tournament.has_entry_fee
                                ? 'bg-subtle text-main'
                                : 'bg-success-muted text-success'
                        )}
                    >
                        {feeText}
                    </span>
                    {deadlineText && !tournament.is_ongoing && (
                        <span className="text-[11px] text-muted">
                            {deadlineText}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}










// ---- бейджи/статус

type BadgeInfo = {
    text: string
    icon: React.ReactNode
    className: string
}

function getMainBadge(t: NextTournamentPayload): BadgeInfo | null {
    // 1. Приоритет — "идёт сейчас"
    if (t.is_ongoing) {
        return {
            text: 'Идёт сейчас',
            icon: <Trophy className="h-3 w-3" />,
            className: 'bg-accent text-[var(--accent-foreground)]',
        }
    }

    // 2. Приглашение в пару
    if (t.my_participation.has_pending_invite) {
        return {
            text: 'Приглашение в пару',
            icon: <UserPlus className="h-3 w-3" />,
            className: 'bg-warning-muted text-warning border-b border-warning',
        }
    }

    // 3. Ищет партнёра
    if (t.my_participation.is_looking_for_partner) {
        return {
            text: 'Ищешь партнёра',
            icon: <AlertCircle className="h-3 w-3" />,
            className: 'bg-warning-muted text-warning border-b border-warning',
        }
    }

    // 4. Участвует
    if (t.my_participation.is_participating) {
        return {
            text: 'Ты участвуешь',
            icon: <Trophy className="h-3 w-3" />,
            className: 'bg-success-muted text-success border-b border-success',
        }
    }

    // 5. Регистрация открыта до N
    if (t.registration_deadline) {
        const deadline = new Date(t.registration_deadline)
        const now = new Date()
        if (deadline > now) {
            const days = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            return {
                text: days === 1 ? 'Регистрация до завтра' : `Регистрация ${days} ${daysWord(days)}`,
                icon: <Calendar className="h-3 w-3" />,
                className: 'bg-accent-muted text-accent border-b border-accent',
            }
        }
    }

    return null
}

function daysWord(n: number): string {
    // 5 дней, 2 дня, 1 день
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod100 >= 11 && mod100 <= 14) return 'дней'
    if (mod10 === 1) return 'день'
    if (mod10 >= 2 && mod10 <= 4) return 'дня'
    return 'дней'
}

function formatDeadline(deadlineIso: string): string {
    const date = new Date(deadlineIso)
    const now = new Date()
    if (date < now) return 'Регистрация закрыта'
    return `До ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
}