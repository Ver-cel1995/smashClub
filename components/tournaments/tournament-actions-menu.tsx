'use client'

import { useState } from 'react'
import { MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { useProgressRouter } from '@/shared/hooks/use-progress-router'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import { useConfirm } from '@/shared/lib/confirm/confirm-context'
import { deleteTournament } from '@/app/(main)/tournaments/actions'

const DropdownMenu = dynamic(
    () => import('@/components/ui/dropdown-menu').then((m) => m.DropdownMenu),
    { ssr: false }
)
const DropdownMenuContent = dynamic(
    () => import('@/components/ui/dropdown-menu').then((m) => m.DropdownMenuContent),
    { ssr: false }
)
const DropdownMenuItem = dynamic(
    () => import('@/components/ui/dropdown-menu').then((m) => m.DropdownMenuItem),
    { ssr: false }
)
const DropdownMenuTrigger = dynamic(
    () => import('@/components/ui/dropdown-menu').then((m) => m.DropdownMenuTrigger),
    { ssr: false }
)

type Props = {
    tournamentId: string
    title: string
}

export function TournamentActionsMenu({ tournamentId, title }: Props) {
    const router = useProgressRouter()
    const confirm = useConfirm()
    const [runAction, isPending] = useProgressAction()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const handleEdit = () => {
        router.push(`/tournaments/${tournamentId}/edit`)
    }

    const handleDelete = async () => {
        const ok = await confirm({
            title: 'Удалить турнир?',
            description: `«${title}» будет удалён вместе со всеми участниками и категориями. Действие нельзя отменить.`,
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            variant: 'danger',
        })
        if (!ok) return

        runAction(async () => {
            const result = await deleteTournament(tournamentId)
            if (result.success) {
                toast.success('Турнир удалён')
                router.push('/tournaments')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <>
            {/* Fullscreen loading overlay поверх всей страницы */}
            {isPending && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-card bg-elevated px-6 py-5 shadow-elevated">
                        <Loader2 className="h-6 w-6 animate-spin text-accent" />
                        <p className="text-sm font-medium text-strong">Удаляем турнир…</p>
                    </div>
                </div>
            )}

            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-hover hover:text-strong transition-colors disabled:opacity-50"
                        aria-label="Меню турнира"
                        disabled={isPending}
                    >
                        <MoreVertical className="h-5 w-5" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-card bg-elevated">
                    <DropdownMenuItem
                        onClick={handleEdit}
                        className="cursor-pointer text-main focus:bg-hover focus:text-strong"
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Редактировать
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={handleDelete}
                        className="cursor-pointer text-danger focus:bg-danger-muted focus:text-danger"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}