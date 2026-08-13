'use client'

import {toast} from 'sonner'
import {UserAvatar} from '@/components/user-avatar'
import {cn} from '@/shared/lib/utils'
import {useProgressAction} from '@/shared/hooks/use-progress-action'
import {useConfirm} from '@/shared/lib/confirm/confirm-context'
import {
    cancelRegistration,
    leavePairAsPartner,
    registerForTournament,
    removePartner,
} from '@/app/(main)/tournaments/actions'
import type {
    MyParticipationInCategory,
    ParticipantPlayerInfo,
    ParticipantRecord,
    TournamentCategoryFull,
} from '@/app/(main)/tournaments/[id]/queries'
import {Trash2, UserPlus, Users, Clock, Loader2, UserX, LogOut} from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
    MS: 'Мужская одиночка',
    WS: 'Женская одиночка',
    MD: 'Мужская пара',
    WD: 'Женская пара',
    XD: 'Смешанная пара',
}

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
    if (categories.length === 0) {
        return (
            <div className="rounded-2xl border border-card bg-card p-6 text-center">
                <p className="text-sm text-muted">Категории пока не добавлены</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
                Категории и участники
            </h2>
            {categories.map((category) => (
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
            {hasEntryFee && entryFee && Object.keys(myParticipation).length > 0 && (
                <div className="rounded-2xl border border-accent bg-accent-muted p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-accent">
                            К оплате за {Object.keys(myParticipation).length} {categoryWord(Object.keys(myParticipation).length)}
                        </span>
                        <span className="text-lg font-bold text-accent">
                            {Object.keys(myParticipation).length * entryFee} ₽
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================================
// Один блок категории
// ============================================================

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
    const totalCount = category.participants.length + category.seekers.length

    return (
        <div className="space-y-2 rounded-2xl border border-card bg-card p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-strong">
                        {CATEGORY_LABELS[category.category] ?? category.category}
                    </h3>
                    {category.age_group && (
                        <p className="text-xs text-muted mt-0.5">{category.age_group}</p>
                    )}
                </div>
                <span className="flex items-center gap-1 text-xs text-muted">
                    <Users className="h-3.5 w-3.5" />
                    {totalCount}
                </span>
            </div>

            {/* «Ищут партнёра» */}
            {category.is_pair_category && category.seekers.length > 0 && (
                <div className="space-y-2 rounded-xl bg-warning-muted p-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-warning">
                        <Clock className="h-3 w-3" />
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

            {/* Участники */}
            {category.participants.length > 0 && (
                <div className="space-y-1.5 pt-1">
                    {category.participants.map((record) => (
                        <ParticipantRow
                            key={record.id}
                            record={record}
                            categoryId={category.id}
                            currentUserId={currentUserId}
                            isCoach={isCoach}
                            isRegistrationOpen={isRegistrationOpen}
                        />
                    ))}
                </div>
            )}

            {totalCount === 0 && (
                <p className="text-xs text-muted italic py-2">Пока никого нет</p>
            )}
        </div>
    )
}

// ============================================================
// Строка участника (пара или одиночка)
// ============================================================

function ParticipantRow({
                            record,
                            categoryId,
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

    // Кто я в этой записи
    const iAmPlayer1 =
        record.player1?.kind === 'player' && record.player1.id === currentUserId
    const iAmPlayer2 =
        record.player2?.kind === 'player' && record.player2.id === currentUserId
    const iAmInvolved = iAmPlayer1 || iAmPlayer2

    // Кнопка "Отменить участие" (удаляет всю запись)
    // Доступна: player1 до дедлайна, тренер всегда
    const canCancelFully =
        isCoach ||
        (iAmPlayer1 && isRegistrationOpen)

    // Кнопка "Освободить пару" — для player2 (уходит из пары, запись остаётся)
    // Доступна: player2 всегда (без дедлайна — освободить свою часть можно всегда)
    const canLeavePair =
        iAmPlayer2 && !iAmPlayer1  // если я оба (что невозможно) — идёт cancel

    // Кнопка "Убрать партнёра" — для player1 или тренера
    // Доступна: если есть партнёр (player2 или guest2) + я player1 или тренер
    const canRemovePartner =
        record.player2 !== null &&
        (isCoach || iAmPlayer1)

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
            if (result.success) {
                toast.success('Регистрация отменена')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    const handleLeavePair = async () => {
        const ok = await confirm({
            title: 'Освободить пару?',
            description:
                'Ты выйдешь из пары, а игрок останется искать нового партнёра.',
            confirmText: 'Освободить',
            cancelText: 'Остаться',
            variant: 'danger',
        })
        if (!ok) return

        runAction(async () => {
            const result = await leavePairAsPartner(record.id)
            if (result.success) {
                toast.success('Ты вышел из пары')
            } else {
                toast.error(result.error || 'Ошибка')
            }
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
            if (result.success) {
                toast.success('Партнёр убран')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-xl p-2 transition-opacity',
                iAmInvolved ? 'bg-accent-muted' : 'bg-subtle',
                isPending && 'opacity-50'
            )}
        >
            {/* Player 1 */}
            <PlayerBadge player={record.player1} currentUserId={currentUserId} />

            {/* Разделитель + Player 2 */}
            {record.player2 && (
                <>
                    <span className="text-xs text-muted">/</span>
                    <PlayerBadge player={record.player2} currentUserId={currentUserId} />
                </>
            )}

            {/* Статус пары */}
            {record.pair_status === 'pending' && (
                <span className="ml-auto text-[10px] font-semibold uppercase text-warning shrink-0">
                    ждёт подтв.
                </span>
            )}
            {record.pair_status === 'confirmed' && (
                <span className="ml-auto text-[10px] font-semibold uppercase text-success shrink-0">
                    ✓ подтв.
                </span>
            )}

            {/* Кнопка "Убрать партнёра" — только для player1 или тренера */}
            {canRemovePartner && (
                <button
                    type="button"
                    onClick={handleRemovePartner}
                    disabled={isPending}
                    className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-warning-muted hover:text-warning transition-colors"
                    aria-label="Убрать партнёра"
                    title="Убрать партнёра"
                >
                    {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <UserX className="h-3.5 w-3.5" />
                    )}
                </button>
            )}

            {/* Кнопка "Освободить пару" — только для player2 (для тех кто застрял) */}
            {canLeavePair && (
                <button
                    type="button"
                    onClick={handleLeavePair}
                    disabled={isPending}
                    className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-warning-muted hover:text-warning transition-colors"
                    aria-label="Освободить пару"
                    title="Выйти из пары"
                >
                    {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <LogOut className="h-3.5 w-3.5" />
                    )}
                </button>
            )}

            {/* Кнопка "Отменить" (удалить всю запись) — только для player1 или тренера */}
            {canCancelFully && (
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-danger-muted hover:text-danger transition-colors"
                    aria-label="Отменить участие"
                    title="Отменить участие"
                >
                    {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                    )}
                </button>
            )}
        </div>
    )
}

// ============================================================
// «Ищет партнёра» — с кнопкой «Стать партнёром»
// ============================================================

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

    const iAmSeeker =
        seeker.player1?.kind === 'player' && seeker.player1.id === currentUserId

    const handleJoin = () => {
        runAction(async () => {
            const result = await registerForTournament({
                tournament_id: tournamentId,
                slots: [
                    {
                        category_id: categoryId,
                        partner: { kind: 'join', record_id: seeker.id },
                    },
                ],
            })
            if (result.success) {
                toast.success('Ты стал партнёром')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-lg bg-card p-2',
                isPending && 'opacity-50'
            )}
        >
            <PlayerBadge player={seeker.player1} currentUserId={currentUserId} />

            {iAmSeeker ? (
                <span className="ml-auto text-[10px] font-semibold uppercase text-warning">
                    ты ищешь пару
                </span>
            ) : canJoin ? (
                <button
                    type="button"
                    onClick={handleJoin}
                    disabled={isPending}
                    className="ml-auto flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-[11px] font-semibold text-[var(--accent-foreground)] hover:opacity-90 disabled:opacity-50"
                >
                    {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <UserPlus className="h-3 w-3" />
                    )}
                    Стать партнёром
                </button>
            ) : null}
        </div>
    )
}

// ============================================================
// Аватарка + имя игрока (или гостя)
// ============================================================

function PlayerBadge({
                         player,
                         currentUserId,
                     }: {
    player: ParticipantPlayerInfo | null
    currentUserId: string
}) {
    if (!player) {
        return <span className="text-xs text-dim italic">—</span>
    }

    const isMe = player.kind === 'player' && player.id === currentUserId

    return (
        <div className="flex items-center gap-1.5 min-w-0">
            {player.kind === 'player' ? (
                <UserAvatar
                    name={player.full_name}
                    avatarUrl={player.avatar_url}
                    size="sm"
                />
            ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-subtle text-[10px] text-muted shrink-0">
                    Г
                </div>
            )}
            <span className="truncate text-xs font-medium text-main">
                {shortName(player.full_name)}
                {isMe && <span className="ml-1 text-accent">(ты)</span>}
                {player.kind === 'guest' && (
                    <span className="ml-1 text-dim">· гость</span>
                )}
            </span>
        </div>
    )
}

// ============================================================
// Helpers
// ============================================================

function shortName(fullName: string): string {
    // "Иванов Иван" → "Иван И."
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