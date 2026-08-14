'use client'

import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, StickyNote } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { TRAINING_STATUS_META } from '@/shared/lib/training-status'
import { cn } from '@/shared/lib/utils'
import { TrainingShareButton } from './training-share-button'
import type { TrainingDetailed } from '@/app/(main)/schedule/queries'

type Props = {
    training: TrainingDetailed
}

export function TrainingPageHeader({ training }: Props) {
    const dateObj = new Date(training.date)
    const dateStr = format(dateObj, 'EEEE, d MMMM', { locale: ru })
    const capDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

    const start = training.start_time.slice(0, 5)
    const end = training.end_time.slice(0, 5)

    const meta = TRAINING_STATUS_META[training.status]

    return (
        <div className="space-y-3">
            {/* Верхняя строка: назад + share */}
            <div className="flex items-center justify-between">
                <Link
                    href="/schedule"
                    className="inline-flex items-center gap-2 text-sm text-muted hover:text-strong"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Расписание
                </Link>

                <TrainingShareButton training={training} variant="icon" />
            </div>

            {/* Основная карточка */}
            <div className="space-y-3 rounded-2xl border border-card bg-card p-4">
                {/* Статус-бейдж */}
                {training.status !== 'normal' && (
                    <div
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                            meta.bgColor,
                            meta.borderColor,
                            meta.color
                        )}
                    >
                        <span>{meta.icon}</span>
                        <span>{meta.label}</span>
                    </div>
                )}

                {/* Дата */}
                <div className="flex items-center gap-2 text-lg font-semibold text-strong">
                    <Calendar className="h-5 w-5 text-accent" />
                    {capDate}
                </div>

                {/* Время */}
                <div className="flex items-center gap-2 text-sm text-muted">
                    <Clock className="h-4 w-4" />
                    {start} – {end}
                </div>

                {/* Заметка */}
                {training.status_note && (
                    <div className="flex items-start gap-2 rounded-xl bg-subtle p-2.5 text-xs text-main">
                        <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted" />
                        <span className="whitespace-pre-line">{training.status_note}</span>
                    </div>
                )}

                {/* Замена */}
                {training.substitute_name && (
                    <div className="rounded-xl bg-info-muted p-2.5 text-xs text-info">
                        👤 Замена: <b>{training.substitute_name}</b>
                    </div>
                )}
            </div>
        </div>
    )
}