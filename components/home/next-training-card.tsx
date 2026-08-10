'use client'

import {useState} from 'react'
import {Ban, Calendar, Check, Clock, Users, X} from 'lucide-react'
import {toast} from 'sonner'
import {Button} from '@/components/ui/button'
import {cn} from '@/shared/lib/utils'
import {formatDateRange, formatTrainingDate} from '@/shared/lib/format'
import {setTrainingAttendance} from '@/app/(main)/home/actions'
import {TrainingAttendanceDialog} from './training-attendance-dialog'
import type {AttendanceStatus, TrainingWithAttendance} from '@/types'
import {TRAINING_STATUS_META} from "@/shared/lib/training-status";
import {useProgressAction} from "@/shared/hooks/use-progress-action";

type Props = {
    training: TrainingWithAttendance
    currentUserId: string
}

/**
 * ПРАВИЛО: при отсутствии тренера
 *
 * school (пн, ср) — вход ЗАПРЕЩЁН всем
 * main (вт, чт, сб) — зал открыт для взрослых
 *
 * Если правило для school изменится (станет можно приходить),
 * просто удалите 'school' из CLOSED_WHEN_NO_COACH
 * и добавьте 'school' в OPEN_FOR_ADULTS_STATUSES (если нужно)
 */
const CLOSED_WHEN_NO_COACH: Set<string> = new Set(['school'])
const NO_COACH_STATUSES = new Set(['no_coach_open', 'tournament_trip'])

export function NextTrainingCard({ training, currentUserId }: Props) {
    const [openDialog, setOpenDialog] = useState(false)
    const [isPending, startTransition] = useProgressAction()
    const [optimisticStatus, setOptimisticStatus] = useState<AttendanceStatus | null>(
        training.my_status
    )

    const isNoCoach = NO_COACH_STATUSES.has(training.status)
    const isSchool = training.training_group === 'school'

    // school + без тренера = закрыто для всех
    const isClosedCompletely = isNoCoach && CLOSED_WHEN_NO_COACH.has(training.training_group ?? '')

    // main + без тренера = открыто для взрослых
    const showAdultsNote = isNoCoach && !isClosedCompletely

    const handleAttendance = (status: AttendanceStatus) => {
        const prev = optimisticStatus
        setOptimisticStatus(status)

        startTransition(async () => {
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
        // Не открываем модалку если зал закрыт полностью
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
                    'rounded-2xl border border-border bg-card p-4 text-left transition',
                    !isClosedCompletely && 'active:scale-[0.99]'
                )}
            >
                {training.status !== 'normal' && (() => {
                    const meta = TRAINING_STATUS_META[training.status]
                    return (
                        <div className="mb-3">
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
                        </div>
                    )
                })()}

                <div className="mb-1 flex items-center gap-2 text-lg font-semibold">
                    <Calendar className="h-5 w-5 text-primary" />
                    {formatTrainingDate(training.date)}
                </div>

                <div className="mb-2 flex items-center gap-2 text-sm text-foreground/80">
                    <Clock className="h-4 w-4" />
                    {formatDateRange(training.start_time, training.end_time)}
                </div>

                {isClosedCompletely && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-400">
                        <Ban className="h-3.5 w-3.5 shrink-0" />
                        Зал закрыт — вход запрещён
                    </div>
                )}

                {showAdultsNote && (
                    <div className="mb-2 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-300">
                        Зал открыт только для взрослых
                    </div>
                )}

                {training.status_note && (
                    <p className="mb-3 text-xs text-muted-foreground">
                        {training.status_note}
                    </p>
                )}

                {!isClosedCompletely && (
                    <>
                        <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            {training.going_count} придут
                        </div>

                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => handleAttendance('going')}
                                className={cn(
                                    'flex-1 gap-2 transition-all duration-200',
                                    isGoing
                                        ? 'border-lime-500/40 bg-lime-500/10 text-lime-400 hover:bg-lime-500/15'
                                        : 'hover:border-lime-500/20 hover:text-lime-400'
                                )}
                            >
                                <Check
                                    className={cn(
                                        'h-4 w-4 transition-all duration-200',
                                        isGoing ? 'text-lime-400' : 'text-muted-foreground'
                                    )}
                                />
                                Я приду
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => handleAttendance('not_going')}
                                className={cn(
                                    'flex-1 gap-2 transition-all duration-200',
                                    isNotGoing
                                        ? 'border-rose-500/30 bg-rose-500/8 text-rose-300 hover:bg-rose-500/12'
                                        : 'hover:border-rose-500/20 hover:text-rose-300'
                                )}
                            >
                                <X
                                    className={cn(
                                        'h-4 w-4 transition-all duration-200',
                                        isNotGoing ? 'text-rose-400' : 'text-muted-foreground'
                                    )}
                                />
                                Не приду
                            </Button>
                        </div>
                    </>
                )}
            </div>

            <TrainingAttendanceDialog
                open={openDialog}
                onOpenChange={setOpenDialog}
                training={training}
                currentUserId={currentUserId}
            />
        </>
    )
}