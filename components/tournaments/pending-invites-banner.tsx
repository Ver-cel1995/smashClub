'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, X, UserPlus, Loader2 } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import { respondToPairInvite } from '@/app/(main)/tournaments/actions'
import type {
    ParticipantRecord,
    TournamentCategoryFull,
} from '@/app/(main)/tournaments/[id]/queries'

const CATEGORY_LABELS: Record<string, string> = {
    MS: 'Мужская одиночка',
    WS: 'Женская одиночка',
    MD: 'Мужская пара',
    WD: 'Женская пара',
    XD: 'Смешанная пара',
}

type Props = {
    invites: ParticipantRecord[]
    categories: TournamentCategoryFull[]
}

export function PendingInvitesBanner({ invites, categories }: Props) {
    const categoryMap = new Map(categories.map((c) => [c.id, c]))

    return (
        <div className="space-y-2 rounded-2xl border border-warning bg-warning-muted p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-warning">
                <UserPlus className="h-3.5 w-3.5" />
                Приглашение в пару ({invites.length})
            </div>
            <div className="space-y-2">
                {invites.map((invite) => (
                    <InviteRow
                        key={invite.id}
                        invite={invite}
                        category={categoryMap.get(invite.category_id)}
                    />
                ))}
            </div>
        </div>
    )
}

function InviteRow({
                       invite,
                       category,
                   }: {
    invite: ParticipantRecord
    category: TournamentCategoryFull | undefined
}) {
    const [runAction, isPending] = useProgressAction()
    const [decidedResponse, setDecidedResponse] = useState<'confirm' | 'decline' | null>(null)

    const inviter = invite.player1
    if (!inviter || inviter.kind !== 'player') return null

    const handleRespond = (response: 'confirm' | 'decline') => {
        setDecidedResponse(response)
        runAction(async () => {
            const result = await respondToPairInvite(invite.id, response)
            if (result.success) {
                toast.success(response === 'confirm' ? 'Пара подтверждена' : 'Приглашение отклонено')
            } else {
                toast.error(result.error || 'Ошибка')
                setDecidedResponse(null)
            }
        })
    }

    const categoryLabel = category
        ? `${CATEGORY_LABELS[category.category] ?? category.category}${
            category.age_group ? ` · ${category.age_group}` : ''
        }`
        : 'Неизвестная категория'

    return (
        <div className="flex items-center gap-2 rounded-xl bg-card p-2">
            <UserAvatar name={inviter.full_name} avatarUrl={inviter.avatar_url} size="md" />
            <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-strong">
                    {inviter.full_name}
                </p>
                <p className="truncate text-xs text-muted">{categoryLabel}</p>
            </div>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => handleRespond('decline')}
                    disabled={isPending}
                    className="rounded-lg bg-subtle p-2 text-muted hover:bg-danger-muted hover:text-danger transition-colors disabled:opacity-50"
                    aria-label="Отклонить"
                >
                    {isPending && decidedResponse === 'decline' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <X className="h-4 w-4" />
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => handleRespond('confirm')}
                    disabled={isPending}
                    className="rounded-lg bg-accent p-2 text-[var(--accent-foreground)] hover:opacity-90 disabled:opacity-50"
                    aria-label="Подтвердить"
                >
                    {isPending && decidedResponse === 'confirm' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Check className="h-4 w-4" />
                    )}
                </button>
            </div>
        </div>
    )
}