'use client'

import { useState } from 'react'
import { Wrench, ChevronRight } from 'lucide-react'
import { RepairDetailsDialog } from './repair-details-dialog'
import type { RepairSummaryCoach } from '@/types'

type Props = {
    data: RepairSummaryCoach
}

export function RepairCardCoach({ data }: Props) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition active:scale-[0.99]"
            >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                    <Wrench className="h-5 w-5 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-0.5 text-sm font-semibold">Ремонт ракеток</div>
                    <div className="text-xs text-muted-foreground">
                        {data.players_count} игроков • {data.rackets_count} ракеток
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs">
            <span>
              <span className="text-muted-foreground">Всего: </span>
              <span className="font-medium">{data.total_cost}₽</span>
            </span>
                        {data.unpaid_cost > 0 && (
                            <span className="text-destructive">
                • Не оплачено: {data.unpaid_cost}₽
              </span>
                        )}
                    </div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <RepairDetailsDialog open={open} onOpenChange={setOpen} data={data} />
        </>
    )
}