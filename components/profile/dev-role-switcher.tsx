'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/shared/lib/utils'
import { switchDevRole } from '@/app/(main)/profile/actions'
import { Shield, User } from 'lucide-react'
import {LottieEmoji} from "@/components/shared/lottie-emoji";

type Props = {
    currentRole: 'coach' | 'player' | 'development' | string
}

export function DevRoleSwitcher({ currentRole }: Props) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()

    // development в UI считаем как «тренерский» режим
    const effective: 'coach' | 'player' =
        currentRole === 'player' ? 'player' : 'coach'

    const setRole = (role: 'coach' | 'player') => {
        if (role === effective || pending) return

        startTransition(async () => {
            const res = await switchDevRole(role)
            if (!res.success) {
                toast.error(res.error || 'Не удалось сменить роль')
                return
            }
            toast.success(role === 'coach' ? 'Режим: Тренер' : 'Режим: Игрок')
            router.refresh()
        })
    }

    return (
        <div className="rounded-2xl bg-warning-muted/30 p-4 shadow-card">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-warning">
                Переключатель роли
            </div>
            <p className="mb-3 text-xs text-muted flex items-center gap-1">
                <span>Только для нас с тобой</span>
                <LottieEmoji emojiId="laugh" size={22} className="inline-block align-middle" />
            </p>

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-subtle p-1 border border-subtle">
                <button
                    type="button"
                    disabled={pending}
                    onClick={() => setRole('coach')}
                    className={cn(
                        'flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all',
                        effective === 'coach'
                            ? 'bg-accent text-[var(--accent-foreground)] shadow-accent'
                            : 'text-muted hover:text-strong hover:bg-hover'
                    )}
                >
                    <Shield className="h-4 w-4" />
                    Тренер
                </button>
                <button
                    type="button"
                    disabled={pending}
                    onClick={() => setRole('player')}
                    className={cn(
                        'flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all',
                        effective === 'player'
                            ? 'bg-accent text-[var(--accent-foreground)] shadow-accent'
                            : 'text-muted hover:text-strong hover:bg-hover'
                    )}
                >
                    <User className="h-4 w-4" />
                    Игрок
                </button>
            </div>

            {pending && (
                <p className="mt-2 text-center text-[11px] text-dim">Переключаем…</p>
            )}
        </div>
    )
}