import Link from 'next/link'
import { Wrench } from 'lucide-react'
import { getRepairTypesLabel } from '@/shared/lib/repair'
import type { RepairSummaryPlayer } from '@/types'
import { formatDayMonth } from "@/shared/lib/format"

type Props = {
    data: RepairSummaryPlayer
}

export function RepairCardPlayer({ data }: Props) {
    const { rackets, total_cost } = data
    const typesLabel = getRepairTypesLabel(rackets)

    const firstBatch = rackets.find((r) => r.batch)?.batch
    const sentDate = firstBatch?.actual_send_date ?? firstBatch?.planned_send_date

    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-input)] border border-[var(--border-card)]">
                    <Wrench className="h-5 w-5 text-accent" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[var(--text-main)]">
                        Ремонт ракеток
                    </div>
                    <div className="truncate text-xs text-[var(--text-muted)]">
                        {sentDate ? `Отправка: ${formatDayMonth(sentDate)}` : typesLabel}
                    </div>
                    <div className="mt-0.5 text-xs">
                        <span className="text-[var(--text-muted)]">Твоя ракетка: </span>
                        <span className="font-bold text-accent">{total_cost}₽</span>
                    </div>
                </div>
            </div>

            <Link
                href="/profile"
                className="shrink-0 rounded-xl border border-accent bg-accent-muted px-3 py-1.5 text-xs font-semibold text-accent transition hover:opacity-80"
            >
                Открыть →
            </Link>
        </div>
    )
}
