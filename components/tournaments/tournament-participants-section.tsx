'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/user-avatar'
import { cn } from '@/shared/lib/utils'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import { useConfirm } from '@/shared/lib/confirm/confirm-context'
import {
    cancelRegistration,
    leavePairAsPartner,
    registerForTournament,
    removePartner,
} from '@/app/(main)/tournaments/registration-actions'
import {
    Trash2, UserPlus, Users, Clock, Loader2, UserX, LogOut,
    Trophy, CheckCircle2, Info, ChevronDown
} from 'lucide-react'
import {
    MyParticipationInCategory, ParticipantPlayerInfo,
    ParticipantRecord,
    TournamentCategoryFull
} from "@/app/(main)/tournaments/[id]/queries";

const CATEGORY_LABELS: Record<string, string> = {
    MS: 'Мужская одиночка',
    WS: 'Женская одиночка',
    MD: 'Мужская пара',
    WD: 'Женская пара',
    XD: 'Смешанная пара',
}

const CAT_ORDER: Record<string, number> = { MS: 1, WS: 2, MD: 3, WD: 4, XD: 5 }

type Props = {
    tournamentId: string
    categories: TournamentCategoryFull[]
    myParticipation: Record<string, MyParticipationInCategory>
    currentUserId: string
    isCoach: boolean
    isRegistrationOpen: boolean
    entryFee: number | null
    hasEntryFee: boolean
}

export function TournamentParticipantsSection({
                                                  tournamentId,
                                                  categories,
                                                  myParticipation,
                                                  currentUserId,
                                                  isCoach,
                                                  isRegistrationOpen,
                                                  entryFee,
                                                  hasEntryFee,
                                              }: Props) {
    const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL')
    const [selectedGroup, setSelectedGroup] = useState<string>('ALL')

    const availableGroups = useMemo(() => {
        const groups = new Set<string>()
        categories.forEach(c => {
            if (c.rating_group) groups.add(c.rating_group)
        })
        return Array.from(groups).sort()
    }, [categories])

    const myParticipatingCategories = useMemo(() => {
        return categories.filter(c => myParticipation[c.id])
    }, [categories, myParticipation])

    // Явно задаём Set<string>, чтобы избежать ошибок TS2345
    const myDisciplines = useMemo(() => {
        const set = new Set<string>()
        myParticipatingCategories.forEach(c => set.add(c.category))
        return set
    }, [myParticipatingCategories])

    const myGroups = useMemo(() => {
        const set = new Set<string>()
        myParticipatingCategories.forEach(c => {
            if (c.rating_group) set.add(c.rating_group)
        })
        return set
    }, [myParticipatingCategories])

    const filteredCategories = useMemo(() => {
        const filtered = categories.filter(c => {
            const matchesDiscipline = selectedDiscipline === 'ALL' || c.category === selectedDiscipline
            const matchesGroup = selectedGroup === 'ALL' || c.rating_group === selectedGroup
            return matchesDiscipline && matchesGroup
        })

        return filtered.sort((a, b) => (CAT_ORDER[a.category] || 99) - (CAT_ORDER[b.category] || 99))
    }, [categories, selectedDiscipline, selectedGroup])

    if (categories.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-subtle bg-subtle/10 p-8 text-center flex flex-col items-center">
                <Info className="w-8 h-8 text-muted mb-2 opacity-50" />
                <p className="text-sm text-muted">Категории пока не добавлены</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="bg-card border border-card rounded-2xl p-3 space-y-2.5 shadow-sm">
                <div className="flex justify-center items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                    {[
                        { code: 'ALL', label: 'Все' },
                        { code: 'MS', label: 'MS' },
                        { code: 'WS', label: 'WS' },
                        { code: 'MD', label: 'MD' },
                        { code: 'WD', label: 'WD' },
                        { code: 'XD', label: 'XD' },
                    ].map(d => (
                        <button
                            key={d.code}
                            onClick={() => setSelectedDiscipline(d.code)}
                            className={cn(
                                'relative px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0',
                                selectedDiscipline === d.code
                                    ? 'bg-accent text-accent-foreground shadow-sm'
                                    : 'bg-subtle/50 text-muted hover:text-main'
                            )}
                        >
                            {d.label}
                            {myDisciplines.has(d.code) && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full animate-pulse-slow border-[1.5px] border-card shadow-[0_0_6px_var(--accent-glow)]" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex justify-center items-center gap-1.5 overflow-x-auto scrollbar-hide border-t border-subtle/50 pt-2">
                    <button
                        onClick={() => setSelectedGroup('ALL')}
                        className={cn(
                            'px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0',
                            selectedGroup === 'ALL'
                                ? 'bg-accent/20 text-accent border border-accent/30'
                                : 'bg-subtle/30 text-muted hover:text-main'
                        )}
                    >
                        Все группы
                    </button>

                    {['A', 'B', 'C', 'D', 'E'].map(g => {
                        const exists = availableGroups.includes(g)
                        return (
                            <button
                                key={g}
                                disabled={!exists}
                                onClick={() => setSelectedGroup(g)}
                                className={cn(
                                    'relative px-2.5 py-1 rounded-lg text-xs font-black transition-all shrink-0',
                                    selectedGroup === g
                                        ? 'bg-accent text-accent-foreground shadow-sm'
                                        : exists
                                            ? 'bg-subtle/50 text-strong hover:bg-subtle'
                                            : 'bg-subtle/10 text-dim/30 cursor-not-allowed border border-transparent'
                                )}
                            >
                                {g}
                                {myGroups.has(g) && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full animate-pulse-slow border-[1.5px] border-card shadow-[0_0_6px_var(--accent-glow)]" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {myParticipatingCategories.length > 0 && (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-2 shadow-sm mb-2">
                    <div className="flex items-center gap-1.5 text-accent">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider">Вы участвуете:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {myParticipatingCategories.map(c => (
                            <span key={c.id} className="text-[10px] font-black bg-accent text-accent-foreground px-2 py-0.5 rounded-md shadow-sm">
                                {c.category} (Группа {c.rating_group || '?'})
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted">
                    Нет категорий, соответствующих выбранному фильтру
                </div>
            ) : (
                <div className="space-y-4 mt-2">
                    {selectedGroup === 'ALL' ? (
                        Array.from(new Set(filteredCategories.map(c => c.rating_group || 'Без группы')))
                            .sort()
                            .map(groupName => {
                                const catsInGroup = filteredCategories.filter(c => (c.rating_group || 'Без группы') === groupName)
                                const countInGroup = catsInGroup.reduce((sum, c) => sum + c.participants.length + c.seekers.length, 0)

                                return (
                                    <GroupAccordion key={groupName} groupName={groupName} count={countInGroup}>
                                        {catsInGroup.map((category) => (
                                            <CategoryBlock
                                                key={category.id}
                                                tournamentId={tournamentId}
                                                category={category}
                                                myParticipation={myParticipation[category.id]}
                                                currentUserId={currentUserId}
                                                isCoach={isCoach}
                                                isRegistrationOpen={isRegistrationOpen}
                                            />
                                        ))}
                                    </GroupAccordion>
                                )
                            })
                    ) : (
                        <div className="space-y-3">
                            {filteredCategories.map((category) => (
                                <CategoryBlock
                                    key={category.id}
                                    tournamentId={tournamentId}
                                    category={category}
                                    myParticipation={myParticipation[category.id]}
                                    currentUserId={currentUserId}
                                    isCoach={isCoach}
                                    isRegistrationOpen={isRegistrationOpen}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {hasEntryFee && entryFee && Object.keys(myParticipation).length > 0 && (
                <div className="rounded-2xl border border-accent bg-accent/10 p-4 mt-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-accent">
                            К оплате за {Object.keys(myParticipation).length} {categoryWord(Object.keys(myParticipation).length)}
                        </span>
                        <span className="text-xl font-black text-accent">
                            {Object.keys(myParticipation).length * entryFee} ₽
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

function GroupAccordion({ groupName, count, children }: { groupName: string, count: number, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <div className="space-y-3">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex w-full items-center justify-between rounded-2xl bg-card border shadow-sm transition-all p-4",
                    isOpen ? "border-subtle" : "border-card hover:border-subtle"
                )}
            >
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-black text-strong uppercase tracking-widest">
                        {groupName === 'Без группы' ? groupName : `Группа ${groupName}`}
                    </h3>
                    <span className="text-[11px] font-mono font-bold bg-subtle text-main px-2 py-1 rounded-md">
                        {count} уч.
                    </span>
                </div>
                <ChevronDown className={cn("w-5 h-5 text-muted transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                    {children}
                </div>
            )}
        </div>
    )
}

function CategoryBlock({
                           tournamentId,
                           category,
                           myParticipation,
                           currentUserId,
                           isCoach,
                           isRegistrationOpen,
                       }: {
    tournamentId: string
    category: TournamentCategoryFull
    myParticipation: MyParticipationInCategory | undefined
    currentUserId: string
    isCoach: boolean
    isRegistrationOpen: boolean
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const MAX_INITIAL = 5

    const visibleParticipants = isExpanded ? category.participants : category.participants.slice(0, MAX_INITIAL)
    const hiddenCount = category.participants.length - visibleParticipants.length

    const totalCount = category.participants.length + category.seekers.length
    const isBracketReady = !isRegistrationOpen && totalCount > 0

    return (
        <div className="space-y-3 cv-auto rounded-2xl border border-card bg-card p-4 shadow-sm transition-colors hover:border-subtle">
            <div className="flex flex-col gap-2 border-b border-subtle pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-accent" />
                        <h3 className="text-sm font-bold text-strong">
                            {CATEGORY_LABELS[category.category] ?? category.category}
                        </h3>
                        {category.rating_group && (
                            <span className="text-[10px] font-black bg-accent/15 text-accent border border-accent/30 px-2 py-0.5 rounded-md">
                                Группа {category.rating_group}
                            </span>
                        )}
                    </div>
                    <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold bg-subtle text-main px-2 py-1 rounded-md">
                        <Users className="w-3 h-3" />
                        {totalCount} уч.
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {isBracketReady ? (
                        <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded border border-success/20 flex items-center gap-1 font-semibold uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> Сетка готова
                        </span>
                    ) : !isRegistrationOpen ? (
                        <span className="text-[10px] bg-subtle text-muted px-2 py-0.5 rounded border border-subtle font-semibold uppercase tracking-wider">
                            Регистрация закрыта
                        </span>
                    ) : (
                        <span className="text-[10px] bg-info/10 text-info px-2 py-0.5 rounded border border-info/20 font-semibold uppercase tracking-wider">
                            Регистрация открыта
                        </span>
                    )}
                </div>
            </div>

            {category.is_pair_category && category.seekers.length > 0 && (
                <div className="space-y-2 rounded-xl bg-warning/5 border border-warning/10 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-warning mb-1">
                        <Clock className="h-3.5 w-3.5" />
                        Ищут партнёра ({category.seekers.length})
                    </div>
                    {category.seekers.map((seeker) => (
                        <SeekerRow
                            key={seeker.id}
                            seeker={seeker}
                            categoryId={category.id}
                            tournamentId={tournamentId}
                            currentUserId={currentUserId}
                            canJoin={isRegistrationOpen && !myParticipation}
                        />
                    ))}
                </div>
            )}

            {category.participants.length > 0 && (
                <div className="space-y-2 pt-1">
                    {visibleParticipants.map((record) => (
                        <ParticipantRow
                            key={record.id}
                            record={record}
                            categoryId={category.id}
                            currentUserId={currentUserId}
                            isCoach={isCoach}
                            isRegistrationOpen={isRegistrationOpen}
                        />
                    ))}

                    {hiddenCount > 0 && (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="w-full py-2.5 mt-2 rounded-xl bg-subtle/30 text-[11px] uppercase tracking-widest font-bold text-muted hover:bg-subtle hover:text-main transition-colors"
                        >
                            Показать ещё {hiddenCount}
                        </button>
                    )}
                </div>
            )}

            {totalCount === 0 && (
                <div className="flex flex-col items-center justify-center py-4 opacity-50">
                    <p className="text-xs font-medium text-dim">Пока никого нет</p>
                </div>
            )}
        </div>
    )
}

function ParticipantRow({
                            record,
                            currentUserId,
                            isCoach,
                            isRegistrationOpen,
                        }: {
    record: ParticipantRecord
    categoryId: string
    currentUserId: string
    isCoach: boolean
    isRegistrationOpen: boolean
}) {
    const confirm = useConfirm()
    const [runAction, isPending] = useProgressAction()

    const iAmPlayer1 = record.player1?.kind === 'player' && record.player1.id === currentUserId
    const iAmPlayer2 = record.player2?.kind === 'player' && record.player2.id === currentUserId
    const iAmInvolved = iAmPlayer1 || iAmPlayer2

    const canCancelFully = isCoach || (iAmPlayer1 && isRegistrationOpen)
    const canLeavePair = iAmPlayer2 && !iAmPlayer1
    const canRemovePartner = record.player2 !== null && (isCoach || iAmPlayer1)

    const handleCancel = async () => {
        const ok = await confirm({
            title: 'Отменить участие?',
            description: 'Регистрация в этой категории будет удалена.',
            confirmText: 'Отменить',
            cancelText: 'Оставить',
            variant: 'danger',
        })
        if (!ok) return

        runAction(async () => {
            const result = await cancelRegistration(record.id)
            if (result.success) toast.success('Регистрация отменена')
            else toast.error(result.error || 'Ошибка')
        })
    }

    const handleLeavePair = async () => {
        const ok = await confirm({
            title: 'Освободить пару?',
            description: 'Ты выйдешь из пары, а игрок останется искать нового партнёра.',
            confirmText: 'Освободить',
            cancelText: 'Остаться',
            variant: 'danger',
        })
        if (!ok) return

        runAction(async () => {
            const result = await leavePairAsPartner(record.id)
            if (result.success) toast.success('Ты вышел из пары')
            else toast.error(result.error || 'Ошибка')
        })
    }

    const handleRemovePartner = async () => {
        const ok = await confirm({
            title: 'Убрать партнёра?',
            description: 'Заявка станет «ищет партнёра».',
            confirmText: 'Убрать',
            cancelText: 'Оставить',
            variant: 'danger',
        })
        if (!ok) return

        runAction(async () => {
            const result = await removePartner(record.id)
            if (result.success) toast.success('Партнёр убран')
            else toast.error(result.error || 'Ошибка')
        })
    }

    return (
        <div className={cn(
            'flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 rounded-xl p-2.5 transition-all overflow-hidden',
            iAmInvolved
                ? 'bg-accent/10 border-accent/40 shadow-[inset_3px_0_0_0_var(--accent-color)]'
                : 'bg-subtle/30 border border-transparent hover:border-subtle',
            isPending && 'opacity-50'
        )}>
            <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
                <PlayerBadge player={record.player1} currentUserId={currentUserId} />

                {record.player2 && (
                    <>
                        <span className="text-xs text-dim shrink-0">/</span>
                        <PlayerBadge player={record.player2} currentUserId={currentUserId} />
                    </>
                )}
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-auto">
                {record.pair_status === 'pending' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-warning bg-warning/10 px-2 py-0.5 rounded border border-warning/20">
                        Ждёт подтв.
                    </span>
                )}

                {canRemovePartner && (
                    <button onClick={handleRemovePartner} disabled={isPending} className="rounded-lg p-1.5 text-muted hover:bg-warning/20 hover:text-warning transition-colors" title="Убрать партнёра">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                    </button>
                )}
                {canLeavePair && (
                    <button onClick={handleLeavePair} disabled={isPending} className="rounded-lg p-1.5 text-muted hover:bg-warning/20 hover:text-warning transition-colors" title="Выйти из пары">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    </button>
                )}
                {canCancelFully && (
                    <button onClick={handleCancel} disabled={isPending} className="rounded-lg p-1.5 text-muted hover:bg-danger/20 hover:text-danger transition-colors" title="Отменить">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                )}
            </div>
        </div>
    )
}

function SeekerRow({
                       seeker,
                       categoryId,
                       tournamentId,
                       currentUserId,
                       canJoin,
                   }: {
    seeker: ParticipantRecord
    categoryId: string
    tournamentId: string
    currentUserId: string
    canJoin: boolean
}) {
    const [runAction, isPending] = useProgressAction()

    const iAmSeeker = seeker.player1?.kind === 'player' && seeker.player1.id === currentUserId

    const handleJoin = () => {
        runAction(async () => {
            const result = await registerForTournament({
                tournament_id: tournamentId,
                slots: [{ category_id: categoryId, partner: { kind: 'join', record_id: seeker.id } }],
            })
            if (result.success) toast.success('Ты стал партнёром')
            else toast.error(result.error || 'Ошибка')
        })
    }

    return (
        <div className={cn('flex items-center gap-2 rounded-lg bg-card border border-warning/10 p-2.5 shadow-sm', isPending && 'opacity-50')}>
            <PlayerBadge player={seeker.player1} currentUserId={currentUserId} />

            {iAmSeeker ? (
                <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-warning">
                    Ваша заявка
                </span>
            ) : canJoin ? (
                <button
                    onClick={handleJoin}
                    disabled={isPending}
                    className="ml-auto flex items-center gap-1.5 rounded-lg bg-warning/20 px-3 py-1.5 text-xs font-bold text-warning hover:bg-warning/30 transition-colors disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                    Предложить пару
                </button>
            ) : null}
        </div>
    )
}

function PlayerBadge({ player, currentUserId }: { player: ParticipantPlayerInfo | null, currentUserId: string }) {
    if (!player) return <span className="text-xs text-dim italic">—</span>

    const isMe = player.kind === 'player' && player.id === currentUserId
    const rating = (player as any).rating;

    return (
        <div className="flex items-center gap-2 min-w-0">
            {player.kind === 'player' ? (
                <UserAvatar name={player.full_name} avatarUrl={player.avatar_url} size="sm" />
            ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-subtle text-[10px] text-muted shrink-0 font-bold">
                    Г
                </div>
            )}
            <div className="flex flex-col">
                <span className="truncate text-[13px] font-semibold text-strong leading-tight">
                    {shortName(player.full_name)}
                    {rating ? <span className="text-dim font-normal font-mono ml-1">· {rating}</span> : ''}
                    {isMe && <span className="ml-1 text-accent font-bold text-[10px] uppercase">(Ты)</span>}
                </span>
                {player.kind === 'guest' && <span className="text-[9px] text-dim font-bold uppercase tracking-widest">Гость</span>}
            </div>
        </div>
    )
}

function shortName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 1) return parts[0]
    return `${parts[0]} ${parts[1][0]}.`
}

function categoryWord(n: number): string {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod100 >= 11 && mod100 <= 14) return 'категорий'
    if (mod10 === 1) return 'категорию'
    if (mod10 >= 2 && mod10 <= 4) return 'категории'
    return 'категорий'
}