'use client'

import {useState, useMemo} from 'react'
import {toast} from 'sonner'
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {X, Loader2} from 'lucide-react'
import {cn} from '@/shared/lib/utils'
import {useProgressAction} from '@/shared/hooks/use-progress-action'
import {registerForTournament} from '@/app/(main)/tournaments/actions'
import {PartnerPicker} from './partner-picker'
import type {
    TournamentCategoryFull,
    MyParticipationInCategory,
} from '@/app/(main)/tournaments/[id]/queries'
import {canPlayerJoinCategory, Gender, getRequiredPartnerGender} from "@/shared/lib/gender";

const CATEGORY_LABELS: Record<string, string> = {
    MS: 'Мужская одиночка',
    WS: 'Женская одиночка',
    MD: 'Мужская пара',
    WD: 'Женская пара',
    XD: 'Смешанная пара',
}

const PAIR_CATEGORIES = new Set(['MD', 'WD', 'XD'])

type PartnerChoice =
    | null // ищу партнёра
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
    currentUserGender: Gender | null   // ← НОВОЕ
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
                                       currentUserGender
                                   }: Props) {
    const [runAction, isPending] = useProgressAction()

    // Доступные категории (те где я ещё не записан)
    const availableCategories = useMemo(
        () => categories
            .filter((c) => !myParticipation[c.id])
            .filter((c) => canPlayerJoinCategory(currentUserGender, c.category)),
        [categories, myParticipation, currentUserGender]
    )

    // Состояние формы: категория_id → { selected, partner }
    const [choices, setChoices] = useState<Record<string, CategoryChoice>>(() => {
        const initial: Record<string, CategoryChoice> = {}
        for (const cat of availableCategories) {
            initial[cat.id] = {selected: false, partner: null}
        }
        return initial
    })

    const selectedCount = Object.values(choices).filter((c) => c.selected).length
    const totalFee = hasEntryFee && entryFee ? selectedCount * entryFee : null

    const updateChoice = (categoryId: string, patch: Partial<CategoryChoice>) => {
        setChoices((prev) => ({
            ...prev,
            [categoryId]: {...prev[categoryId], ...patch},
        }))
    }

    const toggleCategory = (categoryId: string) => {
        setChoices((prev) => ({
            ...prev,
            [categoryId]: {
                ...prev[categoryId],
                selected: !prev[categoryId].selected,
                // При снятии — обнуляем партнёра
                partner: !prev[categoryId].selected ? prev[categoryId].partner : null,
            },
        }))
    }

    const canSubmit = selectedCount > 0 && !isPending

    const handleSubmit = () => {
        const slots = availableCategories
            .filter((cat) => choices[cat.id].selected)
            .map((cat) => {
                const choice = choices[cat.id]
                const isPair = PAIR_CATEGORIES.has(cat.category)

                let partner: {
                    kind: 'player' | 'guest'
                    player_id?: string
                    full_name?: string
                } | null = null

                if (isPair && choice.partner) {
                    if (choice.partner.kind === 'player') {
                        partner = {
                            kind: 'player',
                            player_id: choice.partner.player_id,
                        }
                    } else if (choice.partner.kind === 'guest') {
                        partner = {
                            kind: 'guest',
                            full_name: choice.partner.full_name,
                        }
                    }
                }

                return {
                    category_id: cat.id,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    partner: partner as any,
                }
            })

        runAction(async () => {
            const result = await registerForTournament({
                tournament_id: tournamentId,
                slots,
            })
            if (result.success) {
                toast.success(
                    `Регистрация в ${slots.length} ${categoryWord(slots.length)} создана`
                )
                onOpenChange(false)
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    if (availableCategories.length === 0) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="border-card bg-elevated">
                    <DialogHeader>
                        <DialogTitle className="text-strong">Уже участвуешь</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted">
                        Ты уже записан во все доступные категории.
                    </p>
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
                {/* Header */}
                <div className="flex items-center justify-between border-b border-card p-4">
                    <DialogTitle className="text-base font-bold text-strong">
                        Выбери категории
                    </DialogTitle>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-muted hover:bg-hover hover:text-strong"
                        aria-label="Закрыть"
                    >
                        <X className="h-4 w-4"/>
                    </button>
                </div>

                {/* Список категорий */}
                <div className="overflow-y-auto px-4 py-3" style={{maxHeight: 'calc(90vh - 180px)'}}>
                    <div className="space-y-2">
                        {availableCategories.map((cat) => {
                            const isPair = PAIR_CATEGORIES.has(cat.category)
                            const choice = choices[cat.id]

                            return (
                                <div
                                    key={cat.id}
                                    className={cn(
                                        'rounded-xl border transition-all',
                                        choice.selected
                                            ? 'border-accent bg-accent-muted'
                                            : 'border-card bg-subtle'
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleCategory(cat.id)}
                                        disabled={isPending}
                                        className="flex w-full items-start gap-3 p-3 text-left"
                                    >
                                        <div
                                            className={cn(
                                                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                                                choice.selected
                                                    ? 'border-accent bg-accent'
                                                    : 'border-strong bg-transparent'
                                            )}
                                        >
                                            {choice.selected && (
                                                <svg
                                                    className="h-3 w-3 text-[var(--accent-foreground)]"
                                                    viewBox="0 0 12 12"
                                                    fill="none"
                                                >
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
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-strong">
                                                {CATEGORY_LABELS[cat.category] ?? cat.category}
                                            </p>
                                            {cat.age_group && (
                                                <p className="text-xs text-muted mt-0.5">
                                                    {cat.age_group}
                                                </p>
                                            )}
                                        </div>
                                    </button>

                                    {/* Партнёр — только для парных категорий */}
                                    {choice.selected && isPair && (
                                        <div className="border-t border-card px-3 pb-3 pt-2">
                                            <PartnerPicker
                                                value={choice.partner}
                                                onChange={(partner) => updateChoice(cat.id, { partner })}
                                                disabled={isPending}
                                                requiredGender={getRequiredPartnerGender(currentUserGender, cat.category)}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-card p-4 space-y-2">
                    {totalFee !== null && selectedCount > 0 && (
                        <div className="flex items-center justify-between rounded-xl bg-accent-muted px-3 py-2">
                            <span className="text-xs text-accent">
                                К оплате за {selectedCount} {categoryWord(selectedCount)}
                            </span>
                            <span className="text-base font-bold text-accent">
                                {totalFee} ₽
                            </span>
                        </div>
                    )}
                    <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                Регистрируем…
                            </>
                        ) : selectedCount > 0 ? (
                            `Зарегистрироваться (${selectedCount})`
                        ) : (
                            'Выбери хотя бы одну'
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