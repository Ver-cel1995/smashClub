'use client'

import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserAvatar } from '@/components/user-avatar'
import type { TrainingWithAttendance } from '@/types'
import {AvatarBadge} from "@/components/ui/avatar";

type Props = {
    open: boolean
    onOpenChange: (v: boolean) => void
    training: TrainingWithAttendance
    currentUserId: string
}

export function TrainingAttendanceDialog({
                                             open,
                                             onOpenChange,
                                             training,
                                             currentUserId,
                                         }: Props) {
    const { going, notGoing } = useMemo(() => {
        const list = training.attendance ?? []
        const going = list.filter((a) => a.status === 'going')
        const notGoing = list.filter((a) => a.status === 'not_going')
        return { going, notGoing }
    }, [training.attendance])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideCloseButton className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Кто идёт на тренировку</DialogTitle>
                </DialogHeader>

                <div className="mt-2 space-y-6">
                    <section>
                        <h4 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                            Придут ({going.length})
                        </h4>
                        {going.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Пока никто</p>
                        ) : (
                            <ul className="space-y-2">
                                {going.map((a) => (
                                    <li key={a.id} className="flex items-center gap-3">
                                        <UserAvatar
                                            name={a.profile.full_name}
                                            avatarUrl={a.profile.avatar_url}
                                            size={'sm'}/>
                                        <span className="text-sm">{a.profile.full_name}</span>
                                        {a.player_id === currentUserId && (
                                            <AvatarBadge className="text-[10px]">
                                                Вы
                                            </AvatarBadge>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section>
                        <h4 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                            Не придут ({notGoing.length})
                        </h4>
                        {notGoing.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Нет ответов</p>
                        ) : (
                            <ul className="space-y-2">
                                {notGoing.map((a) => (
                                    <li key={a.id} className="flex items-center gap-3">
                                        <UserAvatar
                                            name={a.profile.full_name}
                                            avatarUrl={a.profile.avatar_url}
                                            size={"lg"}                                      />
                                        <span className="text-sm text-muted-foreground">
                      {a.profile.full_name}
                    </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    )
}