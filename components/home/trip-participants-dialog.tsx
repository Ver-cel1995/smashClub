'use client'

import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserAvatar } from '@/components/user-avatar'
import { Badge } from '@/components/ui/badge'
import type { TripWithParticipants } from '@/types'

type Props = {
    open: boolean
    onOpenChange: (v: boolean) => void
    trip: TripWithParticipants
    currentUserId: string
}

export function TripParticipantsDialog({
                                           open,
                                           onOpenChange,
                                           trip,
                                           currentUserId,
                                       }: Props) {
    const { going, notGoing, maybe } = useMemo(() => {
        const going = trip.participants.filter((p) => p.status === 'going')
        const notGoing = trip.participants.filter((p) => p.status === 'not_going')
        const maybe = trip.participants.filter((p) => p.status === 'maybe')
        return { going, notGoing, maybe }
    }, [trip.participants])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideCloseButton className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{trip.title}</DialogTitle>
                </DialogHeader>

                <div className="mt-2 space-y-6">
                    <Section
                        title="Едут"
                        items={going}
                        currentUserId={currentUserId}
                        emptyText="Пока никто"
                    />
                    {maybe.length > 0 && (
                        <Section
                            title="Может быть"
                            items={maybe}
                            currentUserId={currentUserId}
                            muted
                        />
                    )}
                    <Section
                        title="Не едут"
                        items={notGoing}
                        currentUserId={currentUserId}
                        emptyText="Нет ответов"
                        muted
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Section({
                     title,
                     items,
                     currentUserId,
                     emptyText,
                     muted,
                 }: {
    title: string
    items: TripWithParticipants['participants']
    currentUserId: string
    emptyText?: string
    muted?: boolean
}) {
    return (
        <section>
            <h4 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                {title} ({items.length})
            </h4>
            {items.length === 0 ? (
                emptyText && <p className="text-sm text-muted-foreground">{emptyText}</p>
            ) : (
                <ul className="space-y-2">
                    {items.map((p) => (
                        <li key={p.id} className="flex items-center gap-3">
                            <UserAvatar
                                name={p.profile.full_name}
                                avatarUrl={p.profile.avatar_url}
                                size="sm"
                            />
                            <span className={muted ? 'text-sm text-muted-foreground' : 'text-sm'}>
                {p.profile.full_name}
              </span>
                            {p.player_id === currentUserId && (
                                <Badge variant="secondary" className="text-[10px]">Вы</Badge>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}