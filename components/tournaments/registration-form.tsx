'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Loader2, Trophy, AlertTriangle, Users } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import { registerForTournament } from '@/app/(main)/tournaments/registration-actions'
import { PartnerPicker } from './partner-picker'
import { canPlayerJoinCategory, Gender, getRequiredPartnerGender } from '@/shared/lib/gender'
import Link from 'next/link'
import { MyParticipationInCategory, TournamentCategoryFull } from '@/app/(main)/tournaments/[id]/queries'

const CATEGORY_LABELS: Record<string, string> = {
    MS: 'Мужская одиночка',
    WS: 'Женская одиночка',
    MD: 'Мужская пара',
    WD: 'Женская пара',
    XD: 'Смешанная пара (Микст)',
}

const DISCIPLINE_ORDER = ['MS', 'WS', 'MD', 'WD', 'XD']
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
                                       entryFee,
                                       hasEntryFee,
                                       currentUserGender,
                                   }: Props) {
    const [runAction, isPending] = useProgressAction()
    const [choices, setChoices] = useState<Record<string, CategoryChoice>>({})

    // Разделяем причины недоступности, чтобы показать осмысленный текст,
    // а не universal «записать некуда».
    const { availableCategories, alreadyIn, blockedByGender } = useMemo(() => {
        const available: TournamentCategoryFull[] = []
        const already: TournamentCategoryFull[] = []
        const blocked: TournamentCategoryFull[] = []

        for (const cat of categories) {
            if (myParticipation[cat.id]) {
                already.push(cat)
                continue
            }
            if (currentUserGender && !canPlayerJoinCategory(currentUserGender, cat.category)) {
                blocked.push(cat)
                continue
            }
            available.push(cat)
        }

        available.sort((a, b) => {
            const d = DISCIPLINE_ORDER.indexOf(a.category) - DISCIPLINE_ORDER.indexOf(b.category)
            return d !== 0 ? d : a.rating_group.localeCompare(b.rating_group)
        })

        return { availableCategories: available, alreadyIn: already, blockedByGender: blocked }
    }, [categories, myParticipation, currentUserGender])

    // Группируем по дисциплине: одна строка на дисциплину, группы — чипсами
    const groupedByDiscipline = useMemo(() => {
        const map = new Map<string, TournamentCategoryFull[]>()
        for (const cat of availableCategories) {
            const list = map.get(cat.category) ?? []
            list.push(cat)
            map.set(cat.category, list)
        }
        return [...map.entries()]
    }, [availableCategories])

    const selectedIds = useMemo(
        () => availableCategories.filter((c) => choices[c.id]?.selected).map((c) => c.id),
        [availableCategories, choices]
    )
    const selectedCount = selectedIds.length
    const totalFee = hasEntryFee && entryFee ? selectedCount * entryFee : null

    const updateChoice = (categoryId: string, patch: Partial<CategoryChoice>) => {
        setChoices((prev) => {
            const current = prev[categoryId] ?? { selected: false, partner: null }
            return { ...prev, [categoryId]: { ...current, ...patch } }
        })
    }

    const toggleCategory = (categoryId: string) => {
        setChoices((prev) => {
            const current = prev[categoryId] ?? { selected: false, partner: null }
            const nextSelected = !current.selected
            return {
                ...prev,
                [categoryId]: {
                    selected: nextSelected,
                    // Партнёр сохраняется при повторном включении той же группы
                    partner: nextSelected ? current.partner : null,
                },
            }
        })
    }

    const canSubmit = selectedCount > 0 && !isPending

    const handleSubmit = () => {
        const chosen = availableCategories.filter((cat) => choices[cat.id]?.selected)

        const slots = chosen.map((cat) => {
            const choice = choices[cat.id]
            const isPair = PAIR_CATEGORIES.has(cat.category)

            let partner: PartnerChoice = null
            if (isPair && choice?.partner) {
                partner =
                    choice.partner.kind === 'player'
                        ? {
                            kind: 'player',
                            player_id: choice.partner.player_id,
                            full_name: choice.partner.full_name,
                        }
                        : { kind: 'guest', full_name: choice.partner.full_name }
            }

            return { category_id: cat.id, partner }
        })

        runAction(async () => {
            const result = await registerForTournament({
                tournament_id: tournamentId,
                slots,
            })
            if (result.success) {
                toast.success(`Заявка отправлена: ${slots.length} ${categoryWord(slots.length)}`)
                setChoices({})
                onOpenChange(false)
            } else {
                toast.error(result.error || 'Ошибка регистрации')
            }
        })
    }

    // Пол не указан — без него нельзя определить допустимые дисциплины
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
        const reason =
            categories.length === 0
                ? 'У этого турнира ещё не заведены категории. Попроси тренера добавить дисциплины и группы.'
                : alreadyIn.length > 0 && blockedByGender.length === 0
                    ? 'Вы уже записаны во все категории, доступные для вашего пола.'
                    : alreadyIn.length === 0 && blockedByGender.length > 0
                        ? 'В этом турнире нет категорий, доступных для вашего пола.'
                        : 'Свободных категорий не осталось: часть уже занята вашими заявками, остальные — для другого пола.'

        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="border-card bg-elevated max-w-sm text-center p-6">
                    <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 flex items-center justify-center text-accent mb-3">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-strong text-lg font-bold">Нет доступных категорий</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted mt-2">{reason}</p>
                    {alreadyIn.length > 0 && (
                        <p className="text-xs text-dim mt-2">
                            Ваши заявки: {alreadyIn.map((c) => `${c.category} ${c.rating_group}`).join(', ')}
                        </p>
                    )}
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

                <div className="overflow-y-auto px-4 py-3 space-y-3 max-h-[calc(90vh-200px)]">
                    <p className="text-[11px] text-dim">
                        Можно выбрать несколько групп в каждой дисциплине — по одной заявке на группу.
                    </p>

                    {groupedByDiscipline.map(([discipline, cats]) => {
                        const isPair = PAIR_CATEGORIES.has(discipline)
                        const selectedInDiscipline = cats.filter((c) => choices[c.id]?.selected)

                        return (
                            <div
                                key={discipline}
                                className={cn(
                                    'rounded-xl border p-3 space-y-2.5 transition-all',
                                    selectedInDiscipline.length > 0
                                        ? 'border-accent bg-accent/5'
                                        : 'border-card bg-subtle/40'
                                )}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-bold text-strong">
                                        {CATEGORY_LABELS[discipline] ?? discipline}
                                    </p>
                                    {isPair && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted shrink-0">
                                            <Users className="h-3 w-3" /> Парная
                                        </span>
                                    )}
                                </div>

                                {/* Группы A–E: мультивыбор */}
                                <div className="flex flex-wrap gap-1.5">
                                    {cats.map((cat) => {
                                        const isSelected = Boolean(choices[cat.id]?.selected)
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => toggleCategory(cat.id)}
                                                disabled={isPending}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-lg border text-xs font-black transition-all',
                                                    isSelected
                                                        ? 'border-accent bg-accent text-accent-foreground'
                                                        : 'border-subtle bg-card text-muted hover:border-strong hover:text-strong'
                                                )}
                                            >
                                                {cat.rating_group === 'OPEN' ? 'OPEN' : `Группа ${cat.rating_group}`}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Партнёр выбирается отдельно для каждой выбранной группы */}
                                {isPair &&
                                    selectedInDiscipline.map((cat) => (
                                        <div
                                            key={`partner-${cat.id}`}
                                            className="rounded-lg border border-card/60 bg-card/50 p-2.5 space-y-1.5"
                                        >
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-dim">
                                                Партнёр · {cat.rating_group === 'OPEN' ? 'OPEN' : `группа ${cat.rating_group}`}
                                            </p>
                                            <PartnerPicker
                                                value={choices[cat.id]?.partner ?? null}
                                                onChange={(partner) => updateChoice(cat.id, { partner })}
                                                disabled={isPending}
                                                requiredGender={getRequiredPartnerGender(
                                                    currentUserGender,
                                                    cat.category
                                                )}
                                            />
                                            {!choices[cat.id]?.partner && (
                                                <p className="text-[10px] text-warning">
                                                    Без партнёра заявка попадёт в «Ищут партнёра»
                                                </p>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        )
                    })}

                    {alreadyIn.length > 0 && (
                        <p className="text-[11px] text-dim border-t border-card pt-2">
                            Уже записаны: {alreadyIn.map((c) => `${c.category} ${c.rating_group}`).join(', ')}
                        </p>
                    )}
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
