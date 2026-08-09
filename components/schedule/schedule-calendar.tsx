'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
    parseISO,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/shared/lib/utils'
import { TRAINING_STATUS_META } from '@/shared/lib/training-status'
import type { TrainingWithMeta } from '@/app/(main)/schedule/queries'
import type { TrainingStatus } from '@/types'
import { EditDayDialog } from './edit-day-dialog'

interface ScheduleCalendarProps {
    trainings: TrainingWithMeta[]
    isCoach: boolean
}

export function ScheduleCalendar({ trainings, isCoach }: ScheduleCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [editOpen, setEditOpen] = useState(false)

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const getTrainingsForDay = (date: Date) =>
        trainings.filter((t) => isSameDay(parseISO(t.date), date))

    const selectedTrainings = selectedDate
        ? getTrainingsForDay(selectedDate)
        : []

    const handleDayClick = (day: Date) => {
        if (selectedDate && isSameDay(day, selectedDate)) {
            setSelectedDate(null)
        } else {
            setSelectedDate(day)
        }
    }

    return (
        <div className="space-y-4">
            {/* Навигация */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-base font-semibold text-white capitalize">
                    {format(currentMonth, 'LLLL yyyy', { locale: ru })}
                </h2>
                <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {/* Дни недели */}
            <div className="grid grid-cols-7 gap-1">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold uppercase text-neutral-500 py-1">
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
                            key={day.toISOString()}
                            type="button"
                            onClick={() => handleDayClick(day)}
                            className={cn(
                                'relative flex flex-col items-center gap-0.5 rounded-xl py-2 transition-all',
                                !inMonth && 'opacity-30',
                                today && !selected && 'bg-lime-400/10 border border-lime-400/30',
                                selected && 'bg-lime-400 text-neutral-950',
                                !today && !selected && 'hover:bg-neutral-900'
                            )}
                        >
              <span
                  className={cn(
                      'text-sm font-medium',
                      selected ? 'text-neutral-950' : today ? 'text-lime-400' : 'text-white'
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
                                        />
                                    ))}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Легенда */}
            <div className="flex flex-wrap gap-3 px-1">
                {Object.entries(TRAINING_STATUS_META).map(([key, meta]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', meta.dotColor)} />
                        <span className="text-[10px] text-neutral-500">{meta.shortLabel}</span>
                    </div>
                ))}
            </div>

            {/* Кнопка редактирования выбранного дня (только тренер + есть тренировки) */}
            {isCoach && selectedDate && selectedTrainings.length > 0 && (
                <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-medium text-lime-400 hover:bg-neutral-800 transition-colors"
                >
                    Редактировать {format(selectedDate, 'd MMMM', { locale: ru })}
                </button>
            )}

            {/* Диалог редактирования */}
            {isCoach && selectedDate && selectedTrainings.length > 0 && (
                <EditDayDialog
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    trainings={selectedTrainings}
                    date={selectedDate}
                />
            )}
        </div>
    )
}

function DotIndicator({
                          status,
                          group,
                          selected,
                      }: {
    status: TrainingStatus
    group: string
    selected: boolean
}) {
    if (selected) {
        return <span className="w-1.5 h-1.5 rounded-full bg-neutral-950/60" />
    }

    if (status === 'normal' && group === 'school') {
        return <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
    }

    const meta = TRAINING_STATUS_META[status]
    return <span className={cn('w-1.5 h-1.5 rounded-full', meta.dotColor)} />
}