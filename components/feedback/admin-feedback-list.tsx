'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Trash2, Loader2, ChevronDown, Send, Filter } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { formatRelativeTime } from '@/shared/lib/format'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import { useConfirm } from '@/shared/lib/confirm/confirm-context'
import {
    updateFeedback,
    deleteFeedback,
    type FeedbackWithAuthor,
    type FeedbackStatus,
    type FeedbackType,
} from '@/app/(main)/profile/feedback/actions'
import { FEEDBACK_TYPE_META, FEEDBACK_STATUS_META } from '@/shared/lib/feedback'

const ALL_STATUSES: FeedbackStatus[] = ['new', 'seen', 'in_progress', 'done', 'rejected']
const ALL_TYPES: FeedbackType[] = ['bug', 'idea', 'other']

type Props = {
    feedback: FeedbackWithAuthor[]
}

export function AdminFeedbackList({ feedback }: Props) {
    const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all')
    const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all')

    const filtered = useMemo(() => {
        return feedback.filter((f) => {
            if (statusFilter !== 'all' && f.status !== statusFilter) return false
            if (typeFilter !== 'all' && f.type !== typeFilter) return false
            return true
        })
    }, [feedback, statusFilter, typeFilter])

    return (
        <div className="space-y-3">
            {/* Фильтры */}
            <div className="space-y-2 rounded-2xl border border-card bg-card p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    <Filter className="h-3 w-3" />
                    Фильтры
                </div>

                <div>
                    <p className="mb-1 text-[10px] text-muted">Статус</p>
                    <div className="flex flex-wrap gap-1.5">
                        <FilterChip
                            active={statusFilter === 'all'}
                            onClick={() => setStatusFilter('all')}
                            label="Все"
                        />
                        {ALL_STATUSES.map((s) => (
                            <FilterChip
                                key={s}
                                active={statusFilter === s}
                                onClick={() => setStatusFilter(s)}
                                label={`${FEEDBACK_STATUS_META[s].icon} ${FEEDBACK_STATUS_META[s].label}`}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <p className="mb-1 text-[10px] text-muted">Тип</p>
                    <div className="flex flex-wrap gap-1.5">
                        <FilterChip
                            active={typeFilter === 'all'}
                            onClick={() => setTypeFilter('all')}
                            label="Все"
                        />
                        {ALL_TYPES.map((t) => (
                            <FilterChip
                                key={t}
                                active={typeFilter === t}
                                onClick={() => setTypeFilter(t)}
                                label={`${FEEDBACK_TYPE_META[t].icon} ${FEEDBACK_TYPE_META[t].label}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Список */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-card bg-card p-6 text-center">
                    <p className="text-sm text-muted">Пусто</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((item) => (
                        <AdminFeedbackCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    )
}

function FilterChip({
                        active,
                        onClick,
                        label,
                    }: {
    active: boolean
    onClick: () => void
    label: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors',
                active
                    ? 'border-accent bg-accent-muted text-accent'
                    : 'border-card bg-subtle text-muted hover:border-strong'
            )}
        >
            {label}
        </button>
    )
}

function AdminFeedbackCard({ item }: { item: FeedbackWithAuthor }) {
    const [expanded, setExpanded] = useState(false)
    const [reply, setReply] = useState(item.dev_reply ?? '')
    const [runAction, isPending] = useProgressAction()
    const confirm = useConfirm()

    const typeMeta = FEEDBACK_TYPE_META[item.type]
    const statusMeta = FEEDBACK_STATUS_META[item.status]

    const handleStatusChange = (status: FeedbackStatus) => {
        runAction(async () => {
            const result = await updateFeedback(item.id, { status })
            if (result.success) {
                toast.success('Статус обновлён')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    const handleReplySubmit = () => {
        runAction(async () => {
            const result = await updateFeedback(item.id, { dev_reply: reply })
            if (result.success) {
                toast.success('Ответ отправлен')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    const handleDelete = async () => {
        const ok = await confirm({
            title: 'Удалить обращение?',
            description: 'Это действие нельзя отменить.',
            confirmText: 'Удалить',
            variant: 'danger',
        })
        if (!ok) return

        runAction(async () => {
            const result = await deleteFeedback(item.id)
            if (result.success) {
                toast.success('Удалено')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <div
            className={cn(
                'rounded-2xl border border-card bg-card p-3 transition-opacity',
                isPending && 'opacity-50'
            )}
        >
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-start gap-2 text-left"
            >
                <span className={cn('shrink-0 rounded-lg px-1.5 py-1 text-lg', typeMeta.bgColor)}>
                    {typeMeta.icon}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-strong">
                        {item.title}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                        <span className={cn('rounded-md px-1.5 py-0.5', statusMeta.bgColor, statusMeta.color)}>
                            {statusMeta.icon} {statusMeta.label}
                        </span>
                        {item.author && (
                            <>
                                <span>·</span>
                                <span className="truncate">{item.author.full_name}</span>
                            </>
                        )}
                        <span>·</span>
                        <span>{formatRelativeTime(item.created_at ?? '')}</span>
                    </div>
                </div>
                <ChevronDown
                    className={cn(
                        'h-4 w-4 shrink-0 text-muted transition-transform',
                        expanded && 'rotate-180'
                    )}
                />
            </button>

            {expanded && (
                <div className="mt-3 space-y-3 border-t border-card pt-3">
                    {/* Автор */}
                    {item.author && (
                        <div className="flex items-center gap-2">
                            <UserAvatar
                                name={item.author.full_name}
                                avatarUrl={item.author.avatar_url}
                                size="sm"
                            />
                            <div>
                                <p className="text-xs font-semibold text-strong">
                                    {item.author.full_name}
                                </p>
                                <p className="text-[10px] text-muted">{item.author.role}</p>
                            </div>
                        </div>
                    )}

                    {/* Описание */}
                    <p className="text-sm text-main whitespace-pre-line">{item.description}</p>

                    {/* Скриншот */}
                    {item.screenshot_url && (
                        <a
                            href={item.screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={item.screenshot_url}
                                alt="Скриншот"
                                className="max-h-60 w-full rounded-lg border border-card object-contain"
                            />
                        </a>
                    )}

                    {/* Смена статуса */}
                    <div>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                            Изменить статус
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {ALL_STATUSES.map((s) => {
                                const meta = FEEDBACK_STATUS_META[s]
                                const active = item.status === s
                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => handleStatusChange(s)}
                                        disabled={isPending || active}
                                        className={cn(
                                            'rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors',
                                            active
                                                ? `border-accent ${meta.bgColor} ${meta.color} cursor-default`
                                                : 'border-card bg-subtle text-muted hover:border-strong'
                                        )}
                                    >
                                        {meta.icon} {meta.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Ответ разработчика */}
                    <div>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                            Ответ автору
                        </p>
                        <textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            disabled={isPending}
                            rows={3}
                            placeholder="Ответить автору (виден только ему)"
                            className={cn(
                                'w-full rounded-xl border border-card bg-input px-3 py-2 text-sm text-main placeholder:text-dim resize-y',
                                'focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--accent-color)]/40'
                            )}
                        />
                        <div className="mt-2 flex justify-between">
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isPending}
                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-danger-muted hover:text-danger transition-colors"
                            >
                                <Trash2 className="h-3 w-3" />
                                Удалить
                            </button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={isPending || (reply.trim() === (item.dev_reply ?? '').trim())}
                                onClick={handleReplySubmit}
                            >
                                {isPending ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                    <Send className="mr-1 h-3 w-3" />
                                )}
                                Сохранить ответ
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}