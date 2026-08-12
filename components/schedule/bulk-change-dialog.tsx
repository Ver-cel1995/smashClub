'use client'

import {useState} from 'react'
import {ChevronLeft, ChevronRight, Loader2} from 'lucide-react'
import {toast} from 'sonner'
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isBefore,
    isSameDay,
    isSameMonth,
    startOfMonth,
    startOfWeek,
    subMonths,
} from 'date-fns'
import {ru} from 'date-fns/locale'
import {Dialog, DialogContent, DialogHeader, DialogTitle,} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {updateTrainingsInRange} from '@/app/(main)/schedule/actions'
import {TRAINING_STATUS_META} from '@/shared/lib/training-status'
import {cn} from '@/shared/lib/utils'
import type {TrainingStatus} from '@/types'
import {useProgressAction} from "@/shared/hooks/use-progress-action";

type BulkChangeDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const CHANGE_STATUSES: TrainingStatus[] = [
    'cancelled',
    'holiday',
    'tournament_trip',
    'no_coach_open',
    'substitute',
    'normal',
]

export function BulkChangeDialog({ open, onOpenChange }: BulkChangeDialogProps) {
    const [startDate, setStartDate] = useState<Date | null>(null)
    const [endDate, setEndDate] = useState<Date | null>(null)
    const [status, setStatus] = useState<TrainingStatus>('cancelled')
    const [customNote, setCustomNote] = useState('')
    const [runAction, isPending] = useProgressAction()

    const meta = TRAINING_STATUS_META[status]

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!startDate || !endDate) {
            toast.error('Выбери даты')
            return
        }

        const s = format(startDate, 'yyyy-MM-dd')
        const ed = format(endDate, 'yyyy-MM-dd')

        runAction(async () => {
            const result = await updateTrainingsInRange(s, ed, status, customNote)

            if (result.success) {
                toast.success('Расписание обновлено')
                onOpenChange(false)
                setStartDate(null)
                setEndDate(null)
                setCustomNote('')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    const handleDaySelect = (day: Date) => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(day)
            setEndDate(null)
        } else {
            if (isBefore(day, startDate)) {
                setEndDate(startDate)
                setStartDate(day)
            } else {
                setEndDate(day)
            }
        }
    }

    const rangeLabel = startDate && endDate
        ? `${format(startDate, 'd MMM', { locale: ru })} — ${format(endDate, 'd MMM', { locale: ru })}`
        : startDate
            ? `С ${format(startDate, 'd MMM', { locale: ru })}...`
            : 'Выбери период'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-card text-white max-w-sm" hideCloseButton>
                <DialogHeader>
                    <DialogTitle>Изменить период</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Мини-календарь */}
                    <div className="space-y-1.5">
                        <Label className="text-neutral-300 text-xs">{rangeLabel}</Label>
                        <MiniCalendar
                            startDate={startDate}
                            endDate={endDate}
                            onDaySelect={handleDaySelect}
                        />
                    </div>

                    {/* Причина */}
                    <div className="space-y-2">
                        <Label className="text-neutral-300 text-xs">Причина</Label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {CHANGE_STATUSES.map((s) => {
                                const m = TRAINING_STATUS_META[s]
                                const active = status === s

                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStatus(s)}
                                        disabled={isPending}
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-lg border p-2 text-left transition-colors',
                                            active
                                                ? `${m.borderColor} ${m.bgColor}`
                                                : 'border bg-neutral-950 hover:border-neutral-700'
                                        )}
                                    >
                                        <span className="text-sm">{m.icon}</span>
                                        <span className={cn('text-[11px] font-medium', active ? m.color : 'text-neutral-300')}>
                      {m.shortLabel}
                    </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Автосообщение */}
                    <div className="rounded-lg border border bg-neutral-950 p-2.5">
                        <p className="text-[9px] uppercase tracking-wider text-neutral-500 mb-0.5">
                            Объявление в ленте
                        </p>
                        <p className="text-[11px] text-neutral-300">
                            {meta.icon} {customNote.trim() || meta.label}
                        </p>
                    </div>

                    {/* Своё сообщение */}
                    <textarea
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder="Своё сообщение (необязательно)..."
                        disabled={isPending}
                        rows={2}
                        className={cn(
                            'block w-full rounded-lg border border bg-neutral-950 px-3 py-2 text-xs text-white placeholder:text-neutral-500 resize-none',
                            'focus:outline-none focus:border-lime-400/60 focus:ring-1 focus:ring-lime-400/20'
                        )}
                    />

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            className="flex-1 border text-neutral-300"
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            variant="secondary"
                            disabled={isPending || !startDate || !endDate}
                            className="flex-1 font-semibold"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                            ) : (
                                'Применить'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function MiniCalendar({
                          startDate,
                          endDate,
                          onDaySelect,
                      }: {
    startDate: Date | null
    endDate: Date | null
    onDaySelect: (day: Date) => void
}) {
    const [month, setMonth] = useState(new Date())

    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: calStart, end: calEnd })

    const isInRange = (day: Date) => {
        if (!startDate || !endDate) return false
        return day >= startDate && day <= endDate
    }

    const isRangeStart = (day: Date) => startDate && isSameDay(day, startDate)
    const isRangeEnd = (day: Date) => endDate && isSameDay(day, endDate)

    return (
        <div className="rounded-xl border border bg-neutral-950 p-2">
            <div className="flex items-center justify-between mb-1.5">
                <button
                    type="button"
                    onClick={() => setMonth(subMonths(month, 1))}
                    className="rounded p-1 text-neutral-400 hover:text-white"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-medium text-white capitalize">
          {format(month, 'LLLL', { locale: ru })}
        </span>
                <button
                    type="button"
                    onClick={() => setMonth(addMonths(month, 1))}
                    className="rounded p-1 text-neutral-400 hover:text-white"
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-px">
                {['П', 'В', 'С', 'Ч', 'П', 'С', 'В'].map((d, i) => (
                    <div key={i} className="text-center text-[9px] text-neutral-600 py-0.5">
                        {d}
                    </div>
                ))}

                {days.map((day) => {
                    const inMonth = isSameMonth(day, month)
                    const rangeStart = isRangeStart(day)
                    const rangeEnd = isRangeEnd(day)
                    const inRange = isInRange(day)

                    return (
                        <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => onDaySelect(day)}
                            className={cn(
                                'text-[11px] py-1 rounded transition-colors',
                                !inMonth && 'opacity-20',
                                inRange && !rangeStart && !rangeEnd && 'bg-accent-muted text-accent',
                                (rangeStart || rangeEnd) && 'bg-accent font-bold',
                                !inRange && !rangeStart && !rangeEnd && 'text-white hover:bg-neutral-800'
                            )}
                        >
                            {format(day, 'd')}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}