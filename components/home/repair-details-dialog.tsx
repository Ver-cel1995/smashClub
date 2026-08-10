'use client'

import {Bell} from 'lucide-react'
import {toast} from 'sonner'
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {UserAvatar} from '@/components/user-avatar'
import {getRepairTypesLabel} from '@/shared/lib/repair'
import {remindRepairPayment} from '@/app/(main)/home/actions'
import type {RepairSummaryCoach} from '@/types'
import {useProgressAction} from "@/shared/hooks/use-progress-action";

type Props = {
    open: boolean
    onOpenChange: (v: boolean) => void
    data: RepairSummaryCoach
}

export function RepairDetailsDialog({ open, onOpenChange, data }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideCloseButton className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Ремонт ракеток</DialogTitle>
                </DialogHeader>

                <ul className="mt-2 space-y-3">
                    {data.players.map((p) => (
                        <PlayerRow key={p.profile.id} player={p} />
                    ))}
                </ul>
            </DialogContent>
        </Dialog>
    )
}

function PlayerRow({
                       player,
                   }: {
    player: RepairSummaryCoach['players'][number]
}) {
    const [runAction, isPending] = useProgressAction()

    const typesLabel = getRepairTypesLabel(player.rackets)
    const hasUnpaid = player.unpaid_cost > 0

    const handleRemind = () => {
        runAction(async () => {
            const res = await remindRepairPayment(player.profile.id)
            if (res.success) {
                toast.success('Напоминание отправлено')
            } else {
                toast.error(res.error)
            }
        })
    }

    return (
        <li className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
            <UserAvatar
                name={player.profile.full_name}
                avatarUrl={player.profile.avatar_url}
                size={"lg"} src={""}            />

            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                    {player.profile.full_name}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span>{typesLabel}</span>
                    <span>•</span>
                    <span className="font-medium text-foreground">
            {player.total_cost}₽
          </span>
                    {hasUnpaid && (
                        <Badge variant="destructive" className="text-[10px]">
                            не оплачено {player.unpaid_cost}₽
                        </Badge>
                    )}
                </div>
            </div>

            {hasUnpaid && (
                <Button
                    size="icon"
                    variant="ghost"
                    disabled={isPending}
                    onClick={handleRemind}
                    aria-label="Напомнить об оплате"
                >
                    <Bell className="h-4 w-4" />
                </Button>
            )}
        </li>
    )
}