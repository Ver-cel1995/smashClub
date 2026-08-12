import Link from 'next/link'
import { Wrench, ChevronRight, Plus } from 'lucide-react'
import { getRacketStatusLabel, getRepairTypesLabel } from '@/shared/lib/repair'
import type { RepairRacket } from '@/types'

type Props = {
    rackets: RepairRacket[]
}

export function ProfileRacketsCard({ rackets }: Props) {
    const grouped = new Map<string, RepairRacket[]>()
    for (const r of rackets) {
        const key = r.racket_model ?? 'Ракетка'
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key)!.push(r)
    }
    const rows = Array.from(grouped.entries())
    const hasRackets = rows.length > 0

    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium uppercase text-neutral-500">
                    <Wrench className="h-3.5 w-3.5" />
                    Мои ракетки
                </div>
                <Link
                    href="/profile/rackets"
                    className="text-[11px] text-accent hover:underline"
                >
                    Все
                </Link>
            </div>

            {hasRackets ? (
                <>
                    <ul className="space-y-2">
                        {rows.map(([model, items]) => {
                            const totalCost = items.reduce((s, r) => s + (r.cost ?? 0), 0)
                            const status = items[0].status
                            const typesLabel = getRepairTypesLabel(items)

                            return (
                                <li key={model}>
                                    <Link
                                        href="/profile/rackets"
                                        className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3 transition hover:border-neutral-700"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium text-white">
                                                {model}
                                            </div>
                                            <div className="text-xs text-neutral-500">
                                                {typesLabel} · {getRacketStatusLabel(status)}
                                            </div>
                                        </div>
                                        {totalCost > 0 && (
                                            <div className="text-sm font-medium text-accent">
                                                {totalCost}₽
                                            </div>
                                        )}
                                        <ChevronRight className="h-4 w-4 text-neutral-500" />
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>

                    <Link
                        href="/profile/rackets/new"
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 p-2.5 text-xs text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-300"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Новая заявка
                    </Link>
                </>
            ) : (
                <Link
                    href="/profile/rackets/new"
                    className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-700 p-6 text-center transition hover:border-neutral-600"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800">
                        <Plus className="h-5 w-5 text-neutral-400" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-white">
                            Отдать в ремонт или натяжку
                        </div>
                        <div className="mt-0.5 text-xs text-neutral-500">
                            Создай новую заявку
                        </div>
                    </div>
                </Link>
            )}
        </div>
    )
}