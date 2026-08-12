'use client'

import { useState } from 'react'
import { Ban, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { formatDateRange, formatTrainingDate } from '@/shared/lib/format'
import { setTrainingAttendance } from '@/app/(main)/home/actions'
import { TrainingAttendanceDialog } from './training-attendance-dialog'
import type { AttendanceStatus, TrainingWithAttendance } from '@/types'
import { TRAINING_STATUS_META } from "@/shared/lib/training-status"
import { useProgressAction } from "@/shared/hooks/use-progress-action"

type Props = {
    training: TrainingWithAttendance
    currentUserId: string
}

const CLOSED_WHEN_NO_COACH: Set<string> = new Set(['school'])
const NO_COACH_STATUSES = new Set(['no_coach_open', 'tournament_trip'])

export function NextTrainingCard({ training, currentUserId }: Props) {
    const [openDialog, setOpenDialog] = useState(false)
    const [runAction, isPending] = useProgressAction()
    const [optimisticStatus, setOptimisticStatus] = useState<AttendanceStatus | null>(
        training.my_status
    )

    const isNoCoach = NO_COACH_STATUSES.has(training.status)

    const isClosedCompletely = isNoCoach && CLOSED_WHEN_NO_COACH.has(training.training_group ?? '')
    const showAdultsNote = isNoCoach && !isClosedCompletely

    const handleAttendance = (status: AttendanceStatus) => {
        const prev = optimisticStatus
        setOptimisticStatus(status)

        runAction(async () => {
            const res = await setTrainingAttendance(training.id, status)
            if (!res.success) {
                setOptimisticStatus(prev)
                toast.error(res.error)
            }
        })
    }

    const isGoing = optimisticStatus === 'going'
    const isNotGoing = optimisticStatus === 'not_going'

    const handleCardClick = () => {
        if (!isClosedCompletely) {
            setOpenDialog(true)
        }
    }

    return (
        <>
            <div
                role={isClosedCompletely ? undefined : 'button'}
                tabIndex={isClosedCompletely ? undefined : 0}
                onClick={handleCardClick}
                onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
                className={cn(
                    'rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 text-left transition',
                    !isClosedCompletely && 'active:scale-[0.99]'
                )}
            >
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Ближайшая тренировка
                    </span>
                    {training.status !== 'normal' && (() => {
                        const meta = TRAINING_STATUS_META[training.status]
                        return (
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                                    meta.bgColor,
                                    meta.borderColor,
                                    meta.color
                                )}
                            >
                                <span>{meta.icon}</span>
                                <span>{meta.shortLabel}</span>
                            </span>
                        )
                    })()}
                </div>

                <div className="mb-1 text-base font-bold text-[var(--text-main)]">
                    {formatTrainingDate(training.date)} • {formatDateRange(training.start_time, training.end_time)}
                </div>

                {isClosedCompletely && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-400">
                        <Ban className="h-3.5 w-3.5 shrink-0" />
                        Зал закрыт — вход запрещён
                    </div>
                )}

                {showAdultsNote && (
                    <p className="mb-3 text-xs italic text-[var(--text-muted)]">
                        Зал открыт для взрослых
                    </p>
                )}

                {!isClosedCompletely && (
                    <>
                        <div className="mb-3 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                            <span className="text-sm">🏸</span>
                            <span>{training.going_count} придут</span>
                        </div>

                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                                size="md"
                                variant={isGoing ? 'secondary' : 'outline'}
                                disabled={isPending}
                                onClick={() => handleAttendance('going')}
                                className={cn(
                                    'flex-1 gap-2 font-bold transition-all duration-200',
                                    isGoing
                                        ? 'bg-accent shadow-accent'
                                        : 'hover:border-accent hover:text-accent'
                                )}
                            >
                                <Check className="h-4 w-4" />
                                Я приду
                            </Button>
                            <Button
                                size="md"
                                variant={isNotGoing ? 'danger' : 'outline'}
                                disabled={isPending}
                                onClick={() => handleAttendance('not_going')}
                                className="flex-1 gap-2 font-semibold"
                            >
                                <X className="h-4 w-4" />
                                Не приду
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {openDialog && (
                <TrainingAttendanceDialog
                    open={openDialog}
                    onOpenChange={setOpenDialog}
                    training={training}
                    currentUserId={currentUserId}
                />
            )}
        </>
    )
}
