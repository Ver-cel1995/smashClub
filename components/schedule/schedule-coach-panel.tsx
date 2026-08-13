'use client'

import { useState } from 'react'
import { CalendarRange, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { BulkChangeDialog } from './bulk-change-dialog'
import {
    cancelNextTraining,
    generateTrainings,
} from '@/app/(main)/schedule/actions'
import type { TrainingWithMeta } from '@/app/(main)/schedule/queries'
import { useConfirm } from '@/shared/lib/confirm/confirm-context'
import { useProgressAction } from '@/shared/hooks/use-progress-action'

type ScheduleCoachPanelProps = {
    trainings: TrainingWithMeta[]
}

function getTodayMsk(): string {
    const now = new Date()
    const msk = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60000)
    return msk.toISOString().split('T')[0]
}

export function ScheduleCoachPanel({ trainings }: ScheduleCoachPanelProps) {
    const [bulkOpen, setBulkOpen] = useState(false)
    const [cancelAction, isCancelling] = useProgressAction()
    const [generateAction, isGenerating] = useProgressAction()
    const confirm = useConfirm()

    const today = getTodayMsk()
    const nextTraining = trainings.find(
        (t) => t.date >= today && t.status === 'normal'
    )

    const handleQuickCancel = async () => {
        if (!nextTraining) return

        const ok = await confirm({
            title: 'Отменить ближайшую тренировку?',
            description: 'Объявление опубликуется автоматически.',
            confirmText: 'Отменить тренировку',
            cancelText: 'Не отменять',
            variant: 'danger',
        })

        if (!ok) return

        cancelAction(async () => {
            const result = await cancelNextTraining(nextTraining.id)
            if (result.success) {
                toast.success('Тренировка отменена')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    const handleGenerate = () => {
        generateAction(async () => {
            const result = await generateTrainings(1)
            if (result.success) {
                toast.success('Расписание обновлено')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <>
            <div className="flex gap-2">
                <Button
                    data-tour="schedule-bulk-change"
                    type="button"
                    onClick={() => setBulkOpen(true)}
                    variant="outline"
                    className="flex-1 border text-neutral-300 hover:bg-card"
                >
                    <CalendarRange className="mr-1.5 h-4 w-4" />
                    Изменить период
                </Button>

                {nextTraining && (
                    <Button
                        data-tour="schedule-quick-cancel"
                        type="button"
                        onClick={handleQuickCancel}
                        disabled={isCancelling}
                        variant="outline"
                        className="flex-1 border-red-400/30 text-red-400 hover:bg-red-400/10"
                    >
                        {isCancelling ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            <XCircle className="mr-1.5 h-4 w-4" />
                        )}
                        Меня не будет
                    </Button>
                )}

                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="shrink-0 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-card hover:text-white disabled:opacity-40"
                    aria-label="Обновить расписание"
                    title="Сгенерировать расписание на месяц"
                >
                    {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                </button>
            </div>

            <BulkChangeDialog open={bulkOpen} onOpenChange={setBulkOpen} />
        </>
    )
}