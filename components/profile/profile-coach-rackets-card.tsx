'use client'

import { useTransition, useState } from 'react'
import { Wrench, Bell, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/user-avatar'
import { getRepairTypesLabel, getRacketStatusLabel } from '@/shared/lib/repair'
import { remindRepairPayment } from '@/app/(main)/home/actions'
import { cn } from '@/shared/lib/utils'
import type { RepairSummaryCoach, RepairRacket } from '@/types'

type Props = {
    data: RepairSummaryCoach | null
}

export function ProfileCoachRacketsCard({ data }: Props) {
    if (!data || data.players.length === 0) {
        return (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase text-neutral-500">
                    <Wrench className="h-3.5 w-3.5" />
                    Ремонт ракеток
                </div>
                <p className="py-6 text-center text-xs text-neutral-500">
                    Нет активных заявок от игроков
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-neutral-500">
                <Wrench className="h-3.5 w-3.5" />
                Ремонт ракеток
            </div>
            <div className="mb-3 text-xs text-neutral-500">
                {data.players_count}{' '}
                {data.players_count === 1 ? 'игрок' : 'игроков'} ·{' '}
                {data.rackets_count}{' '}
                {data.rackets_count === 1 ? 'ракетка' : 'ракеток'}
            </div>

            <ul className="space-y-2">
                {data.players.map((p) => (
                    <PlayerRow key={p.profile.id} player={p} />
                ))}
            </ul>
        </div>
    )
}

function PlayerRow({
                       player,
                   }: {
    player: RepairSummaryCoach['players'][number]
}) {
    const [isPending, startTransition] = useTransition()
    const [expanded, setExpanded] = useState(false)

    const hasUnpaid = player.unpaid_cost > 0

    // Группируем ракетки по модели (одна модель = одна карточка,
    // но может быть 2 записи "ремонт" + "натяжка")
    const byModel = new Map<string, RepairRacket[]>()
    for (const r of player.rackets) {
        const key = r.racket_model ?? 'Без модели'
        if (!byModel.has(key)) byModel.set(key, [])
        byModel.get(key)!.push(r)
    }
    const modelRows = Array.from(byModel.entries())

    const handleRemind = () => {
        startTransition(async () => {
            const res = await remindRepairPayment(player.profile.id)
            if (res.success) {
                toast.success(`Напоминание отправлено: ${player.profile.full_name}`)
            } else {
                toast.error(res.error ?? 'Ошибка')
            }
        })
    }

    return (
        <li className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
            {/* Шапка игрока */}
            <div className="flex items-center gap-3 p-3">
                <UserAvatar
                    name={player.profile.full_name}
                    avatarUrl={player.profile.avatar_url}
                    size="sm"
                    src={''}
                />

                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="min-w-0 flex-1 text-left"
                >
                    <div className="truncate text-sm font-medium text-white">
                        {player.profile.full_name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                        <span className="text-neutral-500">
                            {player.rackets.length}{' '}
                            {player.rackets.length === 1 ? 'запись' : 'записей'}
                        </span>
                        <span className="text-neutral-600">·</span>
                        <span className="font-medium text-lime-400">
                            {player.total_cost}₽
                        </span>
                        {hasUnpaid && (
                            <span className="text-rose-400">
                                не оплачено {player.unpaid_cost}₽
                            </span>
                        )}
                    </div>
                </button>

                {expanded ? (
                    <ChevronUp className="h-4 w-4 text-neutral-500" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-neutral-500" />
                )}

                {hasUnpaid && (
                    <button
                        type="button"
                        onClick={handleRemind}
                        disabled={isPending}
                        className={cn(
                            'rounded-lg p-2 text-neutral-400 transition',
                            'hover:bg-lime-400/10 hover:text-lime-400',
                            'disabled:opacity-40'
                        )}
                        aria-label="Напомнить об оплате"
                        title="Напомнить об оплате"
                    >
                        <Bell className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Разворот с моделями */}
            {expanded && (
                <ul className="space-y-1 border-t border-neutral-800 bg-neutral-900/40 p-2">
                    {modelRows.map(([model, items]) => {
                        const modelCost = items.reduce(
                            (s, r) => s + (r.cost ?? 0),
                            0
                        )
                        const typesLabel = getRepairTypesLabel(items)
                        const status = items[0].status

                        return (
                            <li
                                key={model}
                                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-white">{model}</div>
                                    <div className="text-neutral-500">
                                        {typesLabel} · {getRacketStatusLabel(status)}
                                    </div>
                                </div>
                                <div className="ml-2 shrink-0 font-medium text-neutral-300">
                                    {modelCost}₽
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </li>
    )
}