'use client'

import { useState, useMemo } from 'react'
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
import {
    updateTrainingStatus,
    createTrainingDay,
} from '@/app/(main)/schedule/actions'
import { TRAINING_STATUS_META } from '@/shared/lib/training-status'
import { cn } from '@/shared/lib/utils'
import type { TrainingStatus } from '@/types'
import type { TrainingWithMeta } from '@/app/(main)/schedule/queries'
import { useProgressAction } from '@/shared/hooks/use-progress-action'

/**
 * Расширенный список табов.
 * "change_time" — не enum-статус, а специальный режим "изменить только время".
 */
type TabMode = TrainingStatus | 'change_time'

type EditDayDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    trainings: TrainingWithMeta[]  // может быть [] в режиме create
    date: Date
    /** Тренировочный день (пн/вт/ср/чт/сб)? */
    isTrainingDay: boolean
    /** create — новая запись; edit — редактирование существующих */
    mode: 'create' | 'edit'
}

// Все возможные табы для тренировочных дней
const TRAINING_DAY_TABS: TabMode[] = [
    'normal',
    'no_coach_open',
    'substitute',
    'cancelled',
    'holiday',
    'tournament_trip',
    'change_time',
]

// Для нетренировочных дней — только турнир
const NON_TRAINING_DAY_TABS: TabMode[] = ['tournament_trip']

// Метаданные для дополнительных табов, которых нет в TRAINING_STATUS_META
const EXTRA_TAB_META: Record<'change_time', { icon: string; label: string; shortLabel: string; color: string; bgColor: string; borderColor: string }> = {
    change_time: {
        icon: '🕐',
        label: 'Изменить время',
        shortLabel: 'Время',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/40',
    },
}

function getTabMeta(tab: TabMode) {
    if (tab === 'change_time') return EXTRA_TAB_META.change_time
    return TRAINING_STATUS_META[tab]
}

export function EditDayDialog({
                                  open,
                                  onOpenChange,
                                  trainings,
                                  date,
                                  isTrainingDay,
                                  mode,
                              }: EditDayDialogProps) {
    const first = trainings[0]
    const [runAction, isPending] = useProgressAction()

    const availableTabs = isTrainingDay ? TRAINING_DAY_TABS : NON_TRAINING_DAY_TABS

    // Начальный tab: в create-режиме всегда 'tournament_trip' (единственный смысл),
    // в edit-режиме — текущий статус тренировки
    const [tab, setTab] = useState<TabMode>(
        mode === 'create' ? 'tournament_trip' : first?.status ?? 'normal'
    )

    const [note, setNote] = useState(first?.status_note || '')
    const [substitute, setSubstitute] = useState(first?.substitute_name || '')

    // Для табов "Изменить время" и "Турнир" — кастомное время начала
    const [customStartTime, setCustomStartTime] = useState(
        first?.start_time ? first.start_time.slice(0, 5) : '18:00'
    )

    const dateLabel = format(date, 'd MMMM', { locale: ru })

    // Actual status для сохранения (change_time = normal со сменой времени)
    const actualStatus: TrainingStatus = tab === 'change_time' ? 'normal' : tab

    // Нужен ли инпут для времени начала?
    const needsCustomTime = tab === 'change_time' || tab === 'tournament_trip'

    // Нужен ли инпут для комментария (турнир — своя логика)
    const showNote = true  // всегда показываем поле заметки

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        runAction(async () => {
            // === CREATE MODE ===
            // (это нетренировочный день ИЛИ пустой день, где нет тренировок)
            if (mode === 'create') {
                const result = await createTrainingDay({
                    date: format(date, 'yyyy-MM-dd'),
                    status: actualStatus,
                    startTime: needsCustomTime ? customStartTime : '10:00',
                    note: note || undefined,
                    substituteName: actualStatus === 'substitute' ? substitute || undefined : undefined,
                })

                if (result.success) {
                    toast.success('Событие создано')
                    onOpenChange(false)
                } else {
                    toast.error(result.error || 'Ошибка')
                }
                return
            }

            // === EDIT MODE ===
            // Обновляем все существующие тренировки этого дня
            const results = await Promise.all(
                trainings.map((t) =>
                    updateTrainingStatus(
                        t.id,
                        actualStatus,
                        note || undefined,
                        actualStatus === 'substitute' ? substitute || undefined : undefined,
                        needsCustomTime ? customStartTime : undefined
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
            <DialogContent className="bg-card border text-white max-w-sm" hideCloseButton>
                <DialogHeader>
                    <DialogTitle className="capitalize">
                        {mode === 'create' ? `Добавить событие · ${dateLabel}` : `Редактировать ${dateLabel}`}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Табы */}
                    <div className="space-y-2">
                        <Label className="text-neutral-300 text-xs">
                            {mode === 'create' ? 'Что происходит?' : 'Статус'}
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            {availableTabs.map((t) => {
                                const meta = getTabMeta(t)
                                const active = tab === t

                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setTab(t)}
                                        disabled={isPending}
                                        className={cn(
                                            'flex items-center gap-2 rounded-xl border p-2.5 text-left transition-colors',
                                            active
                                                ? `${meta.borderColor} ${meta.bgColor}`
                                                : 'border bg-neutral-950 hover:border-neutral-700'
                                        )}
                                    >
                                        <span>{meta.icon}</span>
                                        <span
                                            className={cn(
                                                'text-xs font-medium',
                                                active ? meta.color : 'text-neutral-300'
                                            )}
                                        >
                                            {meta.shortLabel}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Инпут для замены — только для substitute */}
                    {actualStatus === 'substitute' && (
                        <div className="space-y-1.5">
                            <Label className="text-neutral-300 text-xs">Кто заменяет</Label>
                            <Input
                                value={substitute}
                                onChange={(e) => setSubstitute(e.target.value)}
                                placeholder="Имя тренера"
                                disabled={isPending}
                                className="bg-neutral-950 border text-white"
                            />
                        </div>
                    )}

                    {/* Инпут времени начала — для "Изменить время" и "Турнир" */}
                    {needsCustomTime && (
                        <div className="space-y-1.5">
                            <Label className="text-neutral-300 text-xs">
                                {tab === 'change_time' ? 'Новое время начала' : 'Время начала турнира'}
                            </Label>
                            <Input
                                type="time"
                                value={customStartTime}
                                onChange={(e) => setCustomStartTime(e.target.value)}
                                disabled={isPending}
                                className="bg-neutral-950 border text-white"
                            />
                            {tab === 'change_time' && (
                                <p className="text-[10px] text-neutral-500">
                                    Изменится только время начала. Тренировка остаётся обычной.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Заметка */}
                    {showNote && (
                        <div className="space-y-1.5">
                            <Label className="text-neutral-300 text-xs">
                                {tab === 'tournament_trip' ? 'Комментарий' : 'Заметка'}{' '}
                                <span className="text-neutral-500">(необязательно)</span>
                            </Label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder={
                                    tab === 'tournament_trip'
                                        ? 'Например: Открытый кубок Кущёвской'
                                        : 'Причина...'
                                }
                                disabled={isPending}
                                rows={2}
                                className={cn(
                                    'block w-full rounded-xl border border bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-500 resize-none',
                                    'focus:outline-none focus:border-lime-400/60 focus:ring-1 focus:ring-lime-400/20',
                                    'disabled:opacity-60'
                                )}
                            />
                        </div>
                    )}

                    {/* Подсказка про create-режим */}
                    {mode === 'create' && (
                        <div className="rounded-lg border border-accent bg-accent-muted p-2.5">
                            <p className="text-[11px] text-accent">
                                💡 Создаётся новое событие в календаре. Это не заменяет обычные тренировки.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            className="flex-1 border text-neutral-300"
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            variant="secondary"
                            disabled={isPending}
                            className="flex-1 font-semibold"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                            ) : mode === 'create' ? (
                                'Создать'
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