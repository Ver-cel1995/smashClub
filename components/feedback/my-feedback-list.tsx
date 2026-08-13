'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Loader2, ChevronDown, MessageCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { formatRelativeTime } from '@/shared/lib/format'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import { useConfirm } from '@/shared/lib/confirm/confirm-context'
import { deleteFeedback, type FeedbackRow } from '@/app/(main)/profile/feedback/actions'
import { FEEDBACK_TYPE_META, FEEDBACK_STATUS_META } from '@/shared/lib/feedback'

type Props = {
    feedback: FeedbackRow[]
}

export function MyFeedbackList({ feedback }: Props) {
    return (
        <div className="space-y-2">
            {feedback.map((item) => (
                <FeedbackCard key={item.id} item={item} />
            ))}
        </div>
    )
}

function FeedbackCard({ item }: { item: FeedbackRow }) {
    const [expanded, setExpanded] = useState(false)
    const [runAction, isPending] = useProgressAction()
    const confirm = useConfirm()

    const typeMeta = FEEDBACK_TYPE_META[item.type]
    const statusMeta = FEEDBACK_STATUS_META[item.status]

    const handleDelete = async () => {
        const ok = await confirm({
            title: 'Удалить обращение?',
            description: 'Это действие нельзя отменить.',
            confirmText: 'Удалить',
            cancelText: 'Отмена',
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
                    <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-strong">
                            {item.title}
                        </p>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                        <span className={cn('rounded-md px-1.5 py-0.5', statusMeta.bgColor, statusMeta.color)}>
                            {statusMeta.icon} {statusMeta.label}
                        </span>
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
                    <p className="text-sm text-main whitespace-pre-line">{item.description}</p>

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
                                className="max-h-40 w-full rounded-lg border border-card object-contain"
                            />
                        </a>
                    )}

                    {item.dev_reply && (
                        <div className="rounded-xl border border-accent bg-accent-muted p-3">
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
                                <MessageCircle className="h-3 w-3" />
                                Ответ разработчика
                            </div>
                            <p className="text-sm text-accent whitespace-pre-line">
                                {item.dev_reply}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isPending}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-danger-muted hover:text-danger transition-colors"
                        >
                            {isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Trash2 className="h-3 w-3" />
                            )}
                            Удалить
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}