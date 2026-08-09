'use client'

import { useTransition } from 'react'
import { Check, X, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { setAttendance } from '@/app/(main)/schedule/actions'
import { formatSmartDate, formatTimeRange } from '@/shared/lib/format'
import { TRAINING_STATUS_META } from '@/shared/lib/training-status'
import { cn } from '@/shared/lib/utils'
import type { TrainingWithMeta } from '@/app/(main)/schedule/queries'

interface NextTrainingCardProps {
    training: TrainingWithMeta
}

export function NextTrainingCard({ training }: NextTrainingCardProps) {
    const [isPending, startTransition] = useTransition()

    const meta = TRAINING_STATUS_META[training.status]
    const isCancelled = training.status === 'cancelled' || training.status === 'holiday'

    const handleAttendance = (status: 'going' | 'not_going') => {
        startTransition(async () => {
            const result = await setAttendance(training.id, status)
            if (result.success) {
                toast.success(status === 'going' ? '✓ Иду' : 'Не иду')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <section className={cn('rounded-2xl border p-4 space-y-3', meta.borderColor, meta.bgColor)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <h2 className="text-sm font-semibold text-white">Ближайшая тренировка</h2>
                </div>
                {!isCancelled && training.going_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-neutral-400">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-medium">{training.going_count}</span>
                    </div>
                )}
            </div>

            <div>
                <p className="text-base font-bold text-white capitalize">
                    {formatSmartDate(training.date)}
                </p>
                <p className="text-sm text-neutral-400">
                    {formatTimeRange(training.start_time, training.end_time)}
                </p>
                {training.status !== 'normal' && (
                    <p className={cn('text-xs mt-1', meta.color)}>{meta.label}</p>
                )}
                {training.status_note && (
                    <p className="text-xs text-neutral-500 mt-1">{training.status_note}</p>
                )}
            </div>

            {/* Кнопки приду/не приду */}
            {!isCancelled && (
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => handleAttendance('going')}
                        disabled={isPending}
                        className={cn(
                            'flex items-center justify-center gap-2 rounded-xl border py-2.5 transition-all active:scale-95',
                            training.my_status === 'going'
                                ? 'border-lime-400/50 bg-lime-400/20'
                                : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600',
                            'disabled:opacity-60'
                        )}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin text-lime-400" />
                        ) : (
                            <Check className={cn('h-4 w-4', training.my_status === 'going' ? 'text-lime-400' : 'text-neutral-400')} />
                        )}
                        <span className={cn('text-sm font-semibold', training.my_status === 'going' ? 'text-lime-400' : 'text-neutral-300')}>
              Иду
            </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleAttendance('not_going')}
                        disabled={isPending}
                        className={cn(
                            'flex items-center justify-center gap-2 rounded-xl border py-2.5 transition-all active:scale-95',
                            training.my_status === 'not_going'
                                ? 'border-red-400/50 bg-red-400/20'
                                : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600',
                            'disabled:opacity-60'
                        )}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                        ) : (
                            <X className={cn('h-4 w-4', training.my_status === 'not_going' ? 'text-red-400' : 'text-neutral-400')} />
                        )}
                        <span className={cn('text-sm font-semibold', training.my_status === 'not_going' ? 'text-red-400' : 'text-neutral-300')}>
              Не иду
            </span>
                    </button>
                </div>
            )}
        </section>
    )
}