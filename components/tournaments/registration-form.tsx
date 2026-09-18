'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Loader2, Trophy, AlertTriangle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import { registerForTournament } from '@/app/(main)/tournaments/actions'
import { PartnerPicker } from './partner-picker'
import { canPlayerJoinCategory, Gender, getRequiredPartnerGender } from '@/shared/lib/gender'
import Link from 'next/link'
import {MyParticipationInCategory, TournamentCategoryFull} from "@/app/(main)/tournaments/[id]/queries";

const CATEGORY_LABELS: Record<string, string> = {
    MS: 'Мужская одиночка',
    WS: 'Женская одиночка',
    MD: 'Мужская пара',
    WD: 'Женская пара',
    XD: 'Смешанная пара (Микст)',
}

const PAIR_CATEGORIES = new Set(['MD', 'WD', 'XD'])

type PartnerChoice =
    | null
    | { kind: 'player'; player_id: string; full_name: string }
    | { kind: 'guest'; full_name: string }

type CategoryChoice = {
    selected: boolean
    partner: PartnerChoice
}

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    tournamentId: string
    categories: TournamentCategoryFull[]
    myParticipation: Record<string, MyParticipationInCategory>
    currentUserId: string
    currentUserGender: Gender | null
    entryFee: number | null
    hasEntryFee: boolean
}

export function RegistrationDialog({
                                       open,
                                       onOpenChange,
                                       tournamentId,
                                       categories,
                                       myParticipation,
                                       currentUserId,
                                       entryFee,
                                       hasEntryFee,
                                       currentUserGender,
                                   }: Props) {
    const [runAction, isPending] = useProgressAction()

    // Жесткий фильтр: если у юзера есть пол, фильтруем несовместимые категории
    const availableCategories = categories.filter((cat) => {
        if (myParticipation[cat.id]) return false

        // Защита пола: М -> MS, MD, XD; Ж -> WS, WD, XD
        if (currentUserGender) {
            const allowed = canPlayerJoinCategory(currentUserGender, cat.category)
            if (!allowed) return false
        }

        return true
    })

    const [choices, setChoices] = useState<Record<string, CategoryChoice>>(() => {
        const initial: Record<string, CategoryChoice> = {}
        for (const cat of categories) {
            initial[cat.id] = { selected: false, partner: null }
        }
        return initial
    })

    const selectedCount = Object.values(choices).filter((c) => c.selected).length
    const totalFee = hasEntryFee && entryFee ? selectedCount * entryFee : null

    const updateChoice = (categoryId: string, patch: Partial<CategoryChoice>) => {
        setChoices((prev) => ({
            ...prev,
            [categoryId]: { ...prev[categoryId], ...patch },
        }))
    }

    const toggleCategory = (categoryId: string) => {
        setChoices((prev) => ({
            ...prev,
            [categoryId]: {
                ...prev[categoryId],
                selected: !prev[categoryId]?.selected,
                partner: !prev[categoryId]?.selected ? prev[categoryId]?.partner : null,
            },
        }))
    }

    const canSubmit = selectedCount > 0 && !isPending

    const handleSubmit = () => {
        const slots = availableCategories
            .filter((cat) => choices[cat.id]?.selected)
            .map((cat) => {
                const choice = choices[cat.id]
                const isPair = PAIR_CATEGORIES.has(cat.category)

                let partner: {
                    kind: 'player' | 'guest'
                    player_id?: string
                    full_name?: string
                } | null = null

                if (isPair && choice?.partner) {
                    if (choice.partner.kind === 'player') {
                        partner = { kind: 'player', player_id: choice.partner.player_id }
                    } else if (choice.partner.kind === 'guest') {
                        partner = { kind: 'guest', full_name: choice.partner.full_name }
                    }
                }

                return {
                    category_id: cat.id,
                    partner: partner as any,
                }
            })

        runAction(async () => {
            const result = await registerForTournament({
                tournament_id: tournamentId,
                slots,
            })
            if (result.success) {
                toast.success(`Успешная регистрация в ${slots.length} ${categoryWord(slots.length)}`)
                onOpenChange(false)
            } else {
                toast.error(result.error || 'Ошибка регистрации')
            }
        })
    }

    // Если у пользователя не заполнен пол
    if (!currentUserGender) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="border-card bg-elevated max-w-sm text-center p-6">
                    <div className="w-12 h-12 mx-auto rounded-full bg-warning/10 flex items-center justify-center text-warning mb-3">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-strong text-lg font-bold">Укажите ваш пол</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted mt-2">
                        Для подбора допустимых категорий нужно указать пол в настройках вашего профиля.
                    </p>
                    <div className="flex flex-col gap-2 mt-5">
                        <Link
                            href="/profile/settings"
                            className="w-full py-2.5 bg-accent text-accent-foreground rounded-xl font-bold text-sm"
                        >
                            Перейти в настройки
                        </Link>
                        <Button onClick={() => onOpenChange(false)} variant="ghost" className="text-muted text-xs">
                            Позже
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (availableCategories.length === 0) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="border-card bg-elevated max-w-sm text-center p-6">
                    <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 flex items-center justify-center text-accent mb-3">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-strong text-lg font-bold">Уже задействованы</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted mt-2">
                        Вы уже записаны во все доступные категории данного турнира.
                    </p>
                    <Button onClick={() => onOpenChange(false)} variant="outline" className="mt-4">
                        Понятно
                    </Button>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-h-[90vh] overflow-hidden border-card bg-elevated p-0 sm:max-w-md"
                hideCloseButton
            >
                <div className="flex items-center justify-between border-b border-card p-4 bg-subtle/30">
                    <DialogTitle className="text-base font-bold text-strong flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-accent" /> Выберите категории
                    </DialogTitle>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-muted hover:bg-hover hover:text-strong"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="overflow-y-auto px-4 py-3 space-y-2 max-h-[calc(90vh-180px)]">
                    {availableCategories.map((cat) => {
                        const isPair = PAIR_CATEGORIES.has(cat.category)
                        const choice = choices[cat.id] || { selected: false, partner: null }

                        return (
                            <div
                                key={cat.id}
                                className={cn(
                                    'rounded-xl border transition-all',
                                    choice.selected
                                        ? 'border-accent bg-accent/5 shadow-[0_0_10px_rgba(198,244,50,0.05)]'
                                        : 'border-card bg-subtle/50 hover:border-subtle'
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleCategory(cat.id)}
                                    disabled={isPending}
                                    className="flex w-full items-center justify-between p-3.5 text-left gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className={cn(
                                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                                                choice.selected
                                                    ? 'border-accent bg-accent text-accent-foreground'
                                                    : 'border-strong bg-transparent'
                                            )}
                                        >
                                            {choice.selected && (
                                                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                                                    <path
                                                        d="M2 6L5 9L10 3"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-strong truncate">
                                                {CATEGORY_LABELS[cat.category] ?? cat.category}
                                            </p>
                                            {cat.rating_group && (
                                                <span className="inline-block mt-0.5 text-[10px] font-black bg-accent/15 text-accent px-2 py-0.5 rounded">
                          Группа {cat.rating_group}
                        </span>
                                            )}
                                        </div>
                                    </div>

                                    {hasEntryFee && entryFee && (
                                        <span className="text-xs font-mono font-bold text-accent shrink-0">
                      {entryFee} ₽
                    </span>
                                    )}
                                </button>

                                {choice.selected && isPair && (
                                    <div className="border-t border-card/60 px-3 pb-3 pt-2 bg-card/40">
                                        <PartnerPicker
                                            value={choice.partner}
                                            onChange={(partner) => updateChoice(cat.id, { partner })}
                                            disabled={isPending}
                                            requiredGender={getRequiredPartnerGender(currentUserGender, cat.category as any)}
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="border-t border-card p-4 space-y-2 bg-card">
                    {totalFee !== null && selectedCount > 0 && (
                        <div className="flex items-center justify-between rounded-xl bg-accent/10 px-3.5 py-2.5">
              <span className="text-xs text-accent font-medium">
                Итого за {selectedCount} {categoryWord(selectedCount)}:
              </span>
                            <span className="text-lg font-black text-accent">{totalFee} ₽</span>
                        </div>
                    )}
                    <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                        className="bg-accent text-accent-foreground font-bold h-11"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Регистрация…
                            </>
                        ) : selectedCount > 0 ? (
                            `Зарегистрироваться (${selectedCount})`
                        ) : (
                            'Выберите хотя бы одну категорию'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function categoryWord(n: number): string {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod100 >= 11 && mod100 <= 14) return 'категорий'
    if (mod10 === 1) return 'категорию'
    if (mod10 >= 2 && mod10 <= 4) return 'категории'
    return 'категорий'
}