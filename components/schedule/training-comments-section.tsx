'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { cn } from '@/shared/lib/utils'
import { formatRelativeTime } from '@/shared/lib/format'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import { useConfirm } from '@/shared/lib/confirm/confirm-context'
import { addTrainingComment, deleteTrainingComment } from '@/app/(main)/schedule/actions'
import type { TrainingComment } from '@/app/(main)/schedule/queries'

type Props = {
    trainingId: string
    comments: TrainingComment[]
    currentUserId: string
    isCoach: boolean
}

export function TrainingCommentsSection({
                                            trainingId,
                                            comments,
                                            currentUserId,
                                            isCoach,
                                        }: Props) {
    const [text, setText] = useState('')
    const [runAction, isPending] = useProgressAction()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = text.trim()
        if (!trimmed) return

        runAction(async () => {
            const result = await addTrainingComment(trainingId, trimmed)
            if (result.success) {
                setText('')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <div className="space-y-3 rounded-2xl border border-card bg-card p-4">
            <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted" />
                <h3 className="text-sm font-semibold text-strong">
                    Комментарии ({comments.length})
                </h3>
            </div>

            {/* Список */}
            {comments.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted">
                    Пока нет комментариев. Напиши первый!
                </p>
            ) : (
                <div className="space-y-2">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            currentUserId={currentUserId}
                            isCoach={isCoach}
                        />
                    ))}
                </div>
            )}

            {/* Форма ввода */}
            <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isPending}
                    placeholder="Написать комментарий..."
                    className={cn(
                        'flex-1 rounded-xl border border-card bg-input px-3 py-2 text-sm text-main placeholder:text-dim',
                        'focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--accent-color)]/40'
                    )}
                />
                <button
                    type="submit"
                    disabled={isPending || !text.trim()}
                    className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                        text.trim() && !isPending
                            ? 'bg-accent text-[var(--accent-foreground)] hover:opacity-90'
                            : 'bg-subtle text-muted cursor-not-allowed'
                    )}
                    aria-label="Отправить"
                >
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </button>
            </form>
        </div>
    )
}

function CommentItem({
                         comment,
                         currentUserId,
                         isCoach,
                     }: {
    comment: TrainingComment
    currentUserId: string
    isCoach: boolean
}) {
    const [runAction, isPending] = useProgressAction()
    const confirm = useConfirm()

    const isOwn = comment.author_id === currentUserId
    const canDelete = isOwn || isCoach

    const handleDelete = async () => {
        const ok = await confirm({
            title: 'Удалить комментарий?',
            description: 'Это действие нельзя отменить.',
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            variant: 'danger',
        })
        if (!ok) return

        runAction(async () => {
            const result = await deleteTrainingComment(comment.id)
            if (!result.success) {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    if (!comment.author) return null

    return (
        <div
            className={cn(
                'flex gap-2 rounded-xl p-2 transition-opacity',
                isOwn ? 'bg-accent-muted' : 'bg-subtle',
                isPending && 'opacity-50'
            )}
        >
            <UserAvatar
                name={comment.author.full_name}
                avatarUrl={comment.author.avatar_url}
                size="sm"
            />

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-semibold text-strong">
                        {comment.author.full_name}
                    </p>
                    {comment.author.role === 'coach' && (
                        <span className="text-[9px] font-bold uppercase text-accent">
                            Тренер
                        </span>
                    )}
                    <span className="text-[10px] text-muted">
                        {formatRelativeTime(comment.created_at)}
                    </span>
                </div>
                <p className="mt-0.5 text-sm text-main whitespace-pre-line break-words">
                    {comment.content}
                </p>
            </div>

            {canDelete && (
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-danger-muted hover:text-danger transition-colors"
                    aria-label="Удалить"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    )
}