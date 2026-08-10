'use client'

import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { signOutAction } from '@/app/(main)/profile/actions'
import { useConfirm } from '@/shared/lib/confirm/confirm-context'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import { useProgressRouter } from '@/shared/hooks/use-progress-router'

export function ProfileSignOutButton() {
    const confirm = useConfirm()
    const [runAction, isPending] = useProgressAction()
    const router = useProgressRouter()

    const handleSignOut = async () => {
        const ok = await confirm({
            title: 'Выйти из аккаунта?',
            confirmText: 'Выйти',
            cancelText: 'Отмена',
            variant: 'danger',
        })
        if (!ok) return

        runAction(async () => {
            const result = await signOutAction()
            if (result.success) {
                router.push('/login')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <button
            type="button"
            onClick={handleSignOut}
            disabled={isPending}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-60"
        >
            <LogOut className="h-4 w-4" />
            Выйти
        </button>
    )
}