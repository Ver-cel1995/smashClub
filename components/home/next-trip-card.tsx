'use client'

import {useState} from 'react'
import {Calendar, MapPin} from 'lucide-react'
import {toast} from 'sonner'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {UserAvatar} from '@/components/user-avatar'
import {cn} from '@/shared/lib/utils'
import {formatDateRangeMouth} from '@/shared/lib/format'
import {setTripAttendance} from '@/app/(main)/home/actions'
import type {TripParticipantStatus, TripWithParticipants} from '@/types'
import {TripParticipantsDialog} from "@/components/home/trip-participants-dialog";
import {useProgressAction} from "@/shared/hooks/use-progress-action";

type Props = {
    trip: TripWithParticipants
    currentUserId: string
}

const MAX_AVATARS_SHOWN = 5

export function NextTripCard({ trip, currentUserId }: Props) {
    const [openDialog, setOpenDialog] = useState(false)
    const [runAction, isPending] = useProgressAction()
    const [optimisticStatus, setOptimisticStatus] = useState<TripParticipantStatus | null>(
        trip.my_status
    )

    const going = trip.participants.filter((p) => p.status === 'going')

    const handleStatus = (status: TripParticipantStatus) => {
        const prev = optimisticStatus
        setOptimisticStatus(status)

        runAction(async () => {
            const res = await setTripAttendance(trip.id, status)
            if (!res.success) {
                setOptimisticStatus(prev)
                toast.error(res.error)
            }
        })
    }

    const isGoing = optimisticStatus === 'going'
    const isNotGoing = optimisticStatus === 'not_going'
    const notResponded = !optimisticStatus || optimisticStatus === 'no_response'

    return (
        <>
            <div className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            Ближайший выезд
          </span>
                    {notResponded && (
                        <Badge variant="destructive" className="text-[10px]">
                            Ты не ответил
                        </Badge>
                    )}
                </div>

                <h3 className="mb-2 text-base font-semibold">{trip.title}</h3>

                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateRangeMouth(trip.start_date, trip.end_date)}
                </div>

                {trip.destination && (
                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {trip.destination}
                    </div>
                )}

                {going.length > 0 && (
                    <Button
                        type="button"
                        size="sm"
                        variant={isGoing ? 'secondary' : 'outline'}
                        onClick={() => setOpenDialog(true)}
                        className="mb-3 flex items-center gap-3 rounded-lg p-1 transition active:scale-[0.99]"
                    >
                        <span className="text-xs text-muted-foreground">Едут:</span>
                        <div className="flex -space-x-2">
                            {going.slice(0, MAX_AVATARS_SHOWN).map((p) => (
                                <UserAvatar
                                    key={p.id}
                                    name={p.profile.full_name}
                                    avatarUrl={p.profile.avatar_url}
                                    size="lg"
                                    className="ring-2 ring-card"                                />
                            ))}
                            {going.length > MAX_AVATARS_SHOWN && (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-card">
                                    +{going.length - MAX_AVATARS_SHOWN}
                                </div>
                            )}
                        </div>
                    </Button>
                )}

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={isGoing ? 'secondary' : 'outline'}
                        className={cn('flex-1', isGoing && 'bg-primary text-primary-foreground')}
                        disabled={isPending}
                        onClick={() => handleStatus('going')}
                    >
                        Поеду
                    </Button>
                    <Button
                        size="sm"
                        variant={isGoing ? 'secondary' : 'outline'}
                        className="flex-1"
                        disabled={isPending}
                        onClick={() => handleStatus('not_going')}
                    >
                        Не поеду
                    </Button>
                </div>
            </div>

            {openDialog && (
                <TripParticipantsDialog
                    open={openDialog}
                    onOpenChange={setOpenDialog}
                    trip={trip}
                    currentUserId={currentUserId}
                />
            )}
        </>
    )
}