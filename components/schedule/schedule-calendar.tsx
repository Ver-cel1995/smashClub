'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addMonths,
    subMonths,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/shared/lib/utils'
import { TRAINING_STATUS_META } from '@/shared/lib/training-status'
import type { TrainingWithMeta } from '@/app/(main)/schedule/queries'
import type { TrainingStatus } from '@/types'
import { EditDayDialog } from './edit-day-dialog'
import { useProgressRouter } from '@/shared/hooks/use-progress-router'

type ScheduleCalendarProps = {
    trainings: TrainingWithMeta[]
    isCoach: boolean
}

export function ScheduleCalendar({ trainings, isCoach }: ScheduleCalendarProps) {
    const router = useProgressRouter()
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [editOpen, setEditOpen] = useState(false)

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const trainingsByDate = useMemo(() => {
        const map = new Map<string, TrainingWithMeta[]>()
        for (const t of trainings) {
            const key = t.date.slice(0, 10)
            const list = map.get(key) || []
            list.push(t)
            map.set(key, list)
        }
        return map
    }, [trainings])

    const getTrainingsForDay = (date: Date) => {
        const key = format(date, 'yyyy-MM-dd')
        return trainingsByDate.get(key) || []
    }

    const selectedTrainings = selectedDate ? getTrainingsForDay(selectedDate) : []

    // Отделяем виртуальные турниры от реальных тренировок
    const selectedRealTrainings = selectedTrainings.filter((t) => !t.is_virtual_tournament)
    const selectedVirtualTournaments = selectedTrainings.filter((t) => t.is_virtual_tournament)

    const handleDayClick = (day: Date) => {
        if (selectedDate && isSameDay(day, selectedDate)) {
            setSelectedDate(null)
        } else {
            setSelectedDate(day)
        }
    }

    // Тренировочный день? (по дню недели: 0=вс, 5=пт — нетренировочные)
    const isTrainingDay = (date: Date) => {
        const dow = date.getDay()
        return dow !== 0 && dow !== 5
    }

    // Что показывает кнопка внизу для тренера
    const bottomButtonInfo = useMemo(() => {
        if (!selectedDate || !isCoach) return null

        // Если это виртуальный турнир — предлагаем открыть страницу турнира
        if (selectedVirtualTournaments.length > 0) {
            const tour = selectedVirtualTournaments[0]
            return {
                mode: 'open-tournament' as const,
                tournamentId: tour.virtual_tournament_id!,
                label: `Открыть турнир: ${tour.virtual_tournament_title ?? ''}`,
            }
        }

        // Есть реальные тренировки — редактирование
        if (selectedRealTrainings.length > 0) {
            return {
                mode: 'edit' as const,
                label: `Редактировать ${format(selectedDate, 'd MMMM', { locale: ru })}`,
            }
        }

        // Нет ни тренировок, ни виртуальных турниров — можно добавить событие
        return {
            mode: 'create' as const,
            label: `Добавить тренировку на ${format(selectedDate, 'd MMMM', { locale: ru })}`,
        }
    }, [selectedDate, selectedRealTrainings, selectedVirtualTournaments, isCoach])

    const handleBottomButtonClick = () => {
        if (!bottomButtonInfo) return

        if (bottomButtonInfo.mode === 'open-tournament') {
            router.push(`/tournaments/${bottomButtonInfo.tournamentId}`)
            return
        }

        // edit или create — открываем диалог
        setEditOpen(true)
    }

    return (
        <div className="space-y-4" data-tour="schedule-calendar">
            {/* Навигация */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="rounded-lg p-2 text-neutral-400 hover:bg-card hover:text-white"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-base font-semibold text-white capitalize">
                    {format(currentMonth, 'LLLL yyyy', { locale: ru })}
                </h2>
                <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="rounded-lg p-2 text-neutral-400 hover:bg-card hover:text-white"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {/* Дни недели */}
            <div className="grid grid-cols-7 gap-1">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
                    <div
                        key={d}
                        className="text-center text-[10px] font-semibold uppercase text-neutral-500 py-1"
                    >
                        {d}
                    </div>
                ))}

                {days.map((day) => {
                    const dayTrainings = getTrainingsForDay(day)
                    const inMonth = isSameMonth(day, currentMonth)
                    const today = isToday(day)
                    const selected = selectedDate && isSameDay(day, selectedDate)

                    return (
                        <button
                            data-tour={today ? 'schedule-day-today' : undefined}
                            key={day.toISOString()}
                            type="button"
                            onClick={() => handleDayClick(day)}
                            className={cn(
                                'relative flex flex-col items-center gap-0.5 rounded-xl py-2 transition-all',
                                !inMonth && 'opacity-30',
                                today && !selected && 'bg-accent-muted border-card border-accent',
                                selected && 'bg-accent font-bold',
                                !today && !selected && 'hover:bg-card'
                            )}
                        >
                            <span
                                className={cn(
                                    'text-sm font-medium',
                                    selected ? 'text-neutral-950' : today ? 'text-accent' : 'text-white'
                                )}
                            >
                                {format(day, 'd')}
                            </span>

                            {dayTrainings.length > 0 && (
                                <div className="flex gap-0.5">
                                    {dayTrainings.map((t) => (
                                        <DotIndicator
                                            key={t.id}
                                            status={t.status}
                                            group={t.training_group || 'main'}
                                            selected={!!selected}
                                            isVirtualTournament={t.is_virtual_tournament}
                                        />
                                    ))}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Легенда */}
            <div className="flex flex-wrap gap-3 px-1" data-tour="schedule-legend">
                {Object.entries(TRAINING_STATUS_META).map(([key, meta]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', meta.dotColor)} />
                        <span className="text-[10px] text-neutral-500">{meta.shortLabel}</span>
                    </div>
                ))}
            </div>

            {/* Кнопка действия для тренера */}
            {bottomButtonInfo && (
                <button
                    data-tour="schedule-edit-day"
                    type="button"
                    onClick={handleBottomButtonClick}
                    className={cn(
                        'w-full rounded-2xl border p-3 text-sm font-medium transition-colors',
                        bottomButtonInfo.mode === 'open-tournament'
                            ? 'border-accent bg-accent-muted text-accent hover:bg-accent hover:text-neutral-950'
                            : 'border-card bg-card text-accent hover:bg-neutral-800'
                    )}
                >
                    <span className="inline-flex items-center gap-2">
                        {bottomButtonInfo.mode === 'open-tournament' && (
                            <ExternalLink className="h-4 w-4" />
                        )}
                        {bottomButtonInfo.label}
                    </span>
                </button>
            )}

            {/* Диалог редактирования / создания */}
            {isCoach && selectedDate && editOpen && bottomButtonInfo?.mode !== 'open-tournament' && (
                <EditDayDialog
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    trainings={selectedRealTrainings}
                    date={selectedDate}
                    isTrainingDay={isTrainingDay(selectedDate)}
                    mode={bottomButtonInfo?.mode === 'create' ? 'create' : 'edit'}
                />
            )}
        </div>
    )
}

function DotIndicator({
                          status,
                          group,
                          selected,
                          isVirtualTournament,
                      }: {
    status: TrainingStatus
    group: string
    selected: boolean
    isVirtualTournament?: boolean
}) {
    if (selected) {
        return <span className="w-1.5 h-1.5 rounded-full bg-neutral-950/60" />
    }

    // Виртуальный турнир — своя точка (розовая, как для tournament_trip)
    if (isVirtualTournament) {
        return <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
    }

    if (status === 'normal' && group === 'school') {
        return <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
    }

    const meta = TRAINING_STATUS_META[status]
    return <span className={cn('w-1.5 h-1.5 rounded-full', meta.dotColor)} />
}