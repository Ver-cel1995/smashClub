import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, Plus } from 'lucide-react'
import { getCurrentUser } from '@/shared/lib/auth'
import { getUserRacketsHistory } from '../queries'
import { EmptyState } from '@/components/shared/empty-state'
import { RACKET_STATUS_LABEL, getRepairTypesLabel } from '@/shared/lib/repair'
import { formatDayMonth } from '@/shared/lib/format'
import {RepairRacket} from "@/types";

export const dynamic = 'force-dynamic'

export default async function RacketsPage() {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    const rackets = await getUserRacketsHistory(user.userId)

    // Группируем по batch_id (одна заявка = одна батча)
    const groupedByBatch = new Map<string, typeof rackets>()
    for (const r of rackets) {
        const key = r.batch_id ?? 'no-batch'
        if (!groupedByBatch.has(key)) groupedByBatch.set(key, [])
        groupedByBatch.get(key)!.push(r)
    }
    const batches = Array.from(groupedByBatch.entries())

    return (
        <div className="flex flex-col gap-3 p-4 pb-24">
            <div className="flex items-center justify-between">
                <Link
                    href="/profile"
                    className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Профиль
                </Link>
                <Link
                    href="/profile/rackets/new"
                    className="flex items-center gap-1.5 rounded-xl bg-lime-400 px-3 py-1.5 text-xs font-semibold text-neutral-950"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Новая заявка
                </Link>
            </div>

            <h1 className="text-xl font-bold text-white">Мои ракетки</h1>

            {batches.length === 0 ? (
                <EmptyState
                    icon="🏸"
                    title="Нет активных заявок"
                    description="Отправь ракетку на ремонт или натяжку"
                />
            ) : (
                <div className="space-y-3">
                    {batches.map(([batchId, items]) => (
                        <BatchCard key={batchId} items={items} />
                    ))}
                </div>
            )}
        </div>
    )
}

function BatchCard({ items }: { items: RepairRacket[] }) {
    const totalCost = items.reduce((s, r) => s + (r.cost ?? 0), 0)
    const status = items[0].status
    const createdAt = items[0].created_at

    return (
        <div className="rounded-2xl border border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <div className="text-xs text-neutral-500">
                        Заявка от {createdAt ? formatDayMonth(createdAt) : '—'}
                    </div>
                    <div className="text-sm font-medium text-lime-400">
                        {RACKET_STATUS_LABEL[status]}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-neutral-500">Сумма</div>
                    <div className="text-lg font-bold text-white">{totalCost}₽</div>
                </div>
            </div>

            <ul className="space-y-2">
                {items.map((r) => (
                    <li
                        key={r.id}
                        className="flex items-center justify-between rounded-xl bg-neutral-950 p-2.5 text-sm"
                    >
                        <div>
                            <div className="text-white">{r.racket_model ?? 'Ракетка'}</div>
                            <div className="text-xs text-neutral-500">
                                {getRepairTypesLabel([r])}
                                {r.string_type && ` · ${r.string_type}`}
                                {r.tension && ` · ${r.tension}`}
                            </div>
                        </div>
                        {r.cost && (
                            <div className="text-sm font-medium text-neutral-300">
                                {r.cost}₽
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}