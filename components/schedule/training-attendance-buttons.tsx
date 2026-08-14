'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { setAttendance } from '@/app/(main)/schedule/actions'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import type { AttendanceStatus } from '@/types'

type Props = {
    trainingId: string
    initialStatus: string | null
}

export function TrainingAttendanceButtons({ trainingId, initialStatus }: Props) {
    const [status, setStatus] = useState<AttendanceStatus | null>(
        (initialStatus as AttendanceStatus) || null
    )
    const [runAction, isPending] = useProgressAction()

    const handleClick = (newStatus: AttendanceStatus) => {
        const prev = status
        setStatus(newStatus)

        runAction(async () => {
            const result = await setAttendance(trainingId, newStatus)
            if (!result.success) {
                setStatus(prev)
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    const isGoing = status === 'going'
    const isNotGoing = status === 'not_going'

    return (
        <div className="space-y-2 rounded-2xl border border-card bg-card p-4">
            <p className="text-sm font-semibold text-strong">Ты придёшь?</p>

            <div className="flex gap-2">
                <Button
                    size="md"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleClick('going')}
                    className={cn(
                        'flex-1 gap-2 transition-all',
                        isGoing && 'border-accent bg-accent-muted text-accent'
                    )}
                >
                    <Check className={cn('h-4 w-4', isGoing ? 'text-accent' : 'text-muted')} />
                    Приду
                </Button>
                <Button
                    size="md"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleClick('not_going')}
                    className={cn(
                        'flex-1 gap-2 transition-all',
                        isNotGoing && 'border-danger bg-danger-muted text-danger'
                    )}
                >
                    <X className={cn('h-4 w-4', isNotGoing ? 'text-danger' : 'text-muted')} />
                    Не приду
                </Button>
            </div>
        </div>
    )
}