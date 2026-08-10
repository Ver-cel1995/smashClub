import Link from 'next/link'
import {ChevronRight, Wrench} from 'lucide-react'
import {getRepairTypesLabel} from '@/shared/lib/repair'
import type {RepairSummaryPlayer} from '@/types'
import {formatDayMonth} from "@/shared/lib/format";

type Props = {
    data: RepairSummaryPlayer
}

export function RepairCardPlayer({ data }: Props) {
    const { rackets, total_cost } = data
    const typesLabel = getRepairTypesLabel(rackets)

    // Показываем даты первой активной батчи (если есть)
    const firstBatch = rackets.find((r) => r.batch)?.batch
    const sentDate = firstBatch?.actual_send_date ?? firstBatch?.planned_send_date

    return (
        <Link
            href="/profile"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition active:scale-[0.99]"
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                <Wrench className="h-5 w-5 text-primary" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2 text-sm font-semibold">
                    Ремонт ракеток
                </div>
                <div className="truncate text-xs text-muted-foreground">
                    {typesLabel}
                    {sentDate && ` • Отправлено ${formatDayMonth(sentDate)}`}
                </div>
                <div className="mt-1 text-xs">
                    <span className="text-muted-foreground">Твоя ракетка: </span>
                    <span className="font-medium text-primary">{total_cost}₽</span>
                </div>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
    )
}