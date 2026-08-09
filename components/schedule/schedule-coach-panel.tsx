'use client'

import { useState, useTransition } from 'react'
import { CalendarRange, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { BulkChangeDialog } from './bulk-change-dialog'
import { cancelNextTraining, generateTrainings } from '@/app/(main)/schedule/actions'
import type { TrainingWithMeta } from '@/app/(main)/schedule/queries'

interface ScheduleCoachPanelProps {
    trainings: TrainingWithMeta[]
}

function getTodayMsk(): string {
    const now = new Date()
    const msk = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60000)
    return msk.toISOString().split('T')[0]
}

export function ScheduleCoachPanel({ trainings }: ScheduleCoachPanelProps) {
    const [bulkOpen, setBulkOpen] = useState(false)
    const [isCancelling, startCancelTransition] = useTransition()
    const [isGenerating, startGenTransition] = useTransition()

    const today = getTodayMsk()
    const nextTraining = trainings.find(
        (t) => t.date >= today && t.status === 'normal'
    )

    const handleQuickCancel = () => {
        if (!nextTraining) return
        if (!confirm('Отменить ближайшую тренировку? Объявление опубликуется автоматически.')) return

        startCancelTransition(async () => {
            const result = await cancelNextTraining(nextTraining.id)
            if (result.success) {
                toast.success('Тренировка отменена')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    const handleGenerate = () => {
        startGenTransition(async () => {
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
                    type="button"
                    onClick={() => setBulkOpen(true)}
                    variant="primary"
                    className="flex-1 border-neutral-800 text-neutral-300 hover:bg-neutral-900"
                >
                    <CalendarRange className="h-4 w-4 mr-1.5" />
                    Изменить период
                </Button>

                {nextTraining && (
                    <Button
                        type="button"
                        onClick={handleQuickCancel}
                        disabled={isCancelling}
                        variant="primary"
                        className="flex-1 border-red-400/30 text-red-400 hover:bg-red-400/10"
                    >
                        {isCancelling ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : (
                            <XCircle className="h-4 w-4 mr-1.5" />
                        )}
                        Меня не будет
                    </Button>
                )}

                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="shrink-0 rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors disabled:opacity-40"
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