'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateTrainingStatus } from '@/app/(main)/schedule/actions'
import { TRAINING_STATUS_META } from '@/shared/lib/training-status'
import { cn } from '@/shared/lib/utils'
import type { TrainingStatus } from '@/types'
import type { TrainingWithMeta } from '@/app/(main)/schedule/queries'

interface EditDayDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    trainings: TrainingWithMeta[]
    date: Date
}

const STATUSES: TrainingStatus[] = [
    'normal',
    'no_coach_open',
    'substitute',
    'cancelled',
    'holiday',
    'tournament_trip',
]

export function EditDayDialog({
                                  open,
                                  onOpenChange,
                                  trainings,
                                  date,
                              }: EditDayDialogProps) {
    const first = trainings[0]
    const [status, setStatus] = useState<TrainingStatus>(first.status)
    const [note, setNote] = useState(first.status_note || '')
    const [substitute, setSubstitute] = useState(first.substitute_name || '')
    const [isPending, startTransition] = useTransition()

    const dateLabel = format(date, 'd MMMM', { locale: ru })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            // Обновляем все тренировки этого дня
            const results = await Promise.all(
                trainings.map((t) =>
                    updateTrainingStatus(
                        t.id,
                        status,
                        note || undefined,
                        status === 'substitute' ? substitute || undefined : undefined
                    )
                )
            )

            const allOk = results.every((r) => r.success)
            if (allOk) {
                toast.success('Сохранено')
                onOpenChange(false)
            } else {
                const err = results.find((r) => !r.success)
                toast.error(err && 'error' in err ? err.error : 'Ошибка')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="bg-neutral-900 border-neutral-800 text-white max-w-sm"
                hideCloseButton
            >
                <DialogHeader>
                    <DialogTitle className="capitalize">
                        Редактировать {dateLabel}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-neutral-300 text-xs">Статус</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {STATUSES.map((s) => {
                                const meta = TRAINING_STATUS_META[s]
                                const active = status === s

                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStatus(s)}
                                        disabled={isPending}
                                        className={cn(
                                            'flex items-center gap-2 rounded-xl border p-2.5 text-left transition-colors',
                                            active
                                                ? `${meta.borderColor} ${meta.bgColor}`
                                                : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                                        )}
                                    >
                                        <span>{meta.icon}</span>
                                        <span className={cn('text-xs font-medium', active ? meta.color : 'text-neutral-300')}>
                      {meta.shortLabel}
                    </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {status === 'substitute' && (
                        <div className="space-y-1.5">
                            <Label className="text-neutral-300 text-xs">Кто заменяет</Label>
                            <Input
                                value={substitute}
                                onChange={(e) => setSubstitute(e.target.value)}
                                placeholder="Имя тренера"
                                disabled={isPending}
                                className="bg-neutral-950 border-neutral-800 text-white"
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-neutral-300 text-xs">
                            Заметка <span className="text-neutral-500">(необязательно)</span>
                        </Label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Причина..."
                            disabled={isPending}
                            rows={2}
                            className={cn(
                                'block w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-500 resize-none',
                                'focus:outline-none focus:border-lime-400/60 focus:ring-1 focus:ring-lime-400/20',
                                'disabled:opacity-60'
                            )}
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            className="flex-1 border-neutral-800 text-neutral-300"
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 bg-lime-400 hover:bg-lime-500 text-neutral-950 font-semibold"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                            ) : (
                                'Сохранить'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}