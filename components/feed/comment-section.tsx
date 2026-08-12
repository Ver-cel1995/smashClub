'use client'

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/user-avatar'
import { formatRelativeTime } from '@/shared/lib/format'
import { deleteComment } from '@/app/(main)/feed/actions'
import { cn } from '@/shared/lib/utils'
import type { CommentWithAuthor } from '@/app/(main)/feed/queries'
import { useConfirm } from '@/shared/lib/confirm/confirm-context'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import { CommentInput } from '@/components/feed/comment-input'

interface CommentSectionProps {
    postId: string
    comments: CommentWithAuthor[]
    currentUserId: string
    isCoach: boolean
}

export function CommentSection({
                                   postId,
                                   comments,
                                   currentUserId,
                                   isCoach,
                               }: CommentSectionProps) {
    const rootComments = comments.filter((c) => !c.parent_comment_id)
    const replies = comments.filter((c) => c.parent_comment_id)

    const getReplies = (commentId: string) =>
        replies.filter((r) => r.parent_comment_id === commentId)

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">
                Комментарии ({comments.length})
            </h3>

            <div className="space-y-3">
                {rootComments.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        replies={getReplies(comment.id)}
                        postId={postId}
                        currentUserId={currentUserId}
                        isCoach={isCoach}
                    />
                ))}
            </div>

            <CommentInput postId={postId} />
        </div>
    )
}

function CommentItem({
                         comment,
                         replies,
                         postId,
                         currentUserId,
                         isCoach,
                         isReply = false,
                     }: {
    comment: CommentWithAuthor
    replies: CommentWithAuthor[]
    postId: string
    currentUserId: string
    isCoach: boolean
    isReply?: boolean
}) {
    const [showReplyInput, setShowReplyInput] = useState(false)
    const [runAction, isPending] = useProgressAction()
    const confirm = useConfirm()

    const canDelete = comment.author_id === currentUserId || isCoach

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
            const result = await deleteComment(comment.id, postId)
            if (result.success) {
                toast.success('Комментарий удалён')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <div className={cn('space-y-2', isReply && 'ml-10')}>
            <div className="flex gap-3">
                <UserAvatar
                    name={comment.author.full_name}
                    avatarUrl={comment.author.avatar_url}
                    size="sm"
                    src={''}
                />

                <div className="min-w-0 flex-1">
                    <div className="rounded-2xl bg-neutral-800/50 px-3 py-2">
                        <div className="mb-0.5 flex items-center gap-2">
                            <span className="truncate text-xs font-semibold text-white">
                                {comment.author.full_name}
                            </span>
                            {comment.author.role === 'coach' && (
                                <span className="shrink-0 rounded-full border border-accent bg-accent-muted px-1 py-0.5 text-[8px] font-bold uppercase text-accent">
                                    Тренер
                                </span>
                            )}
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm text-neutral-200">
                            {comment.content}
                        </p>
                    </div>

                    <div className="mt-1 flex items-center gap-3 px-1">
                        <span className="text-[11px] text-neutral-500">
                            {formatRelativeTime(comment.created_at)}
                        </span>

                        {!isReply && (
                            <button
                                type="button"
                                onClick={() => setShowReplyInput(!showReplyInput)}
                                className="text-[11px] font-medium text-neutral-400 transition-colors hover:text-accent"
                            >
                                Ответить
                            </button>
                        )}

                        {canDelete && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isPending}
                                className={cn(
                                    'text-[11px] text-neutral-500 transition-colors hover:text-red-400',
                                    'disabled:pointer-events-none disabled:opacity-40'
                                )}
                            >
                                {isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Trash2 className="h-3 w-3" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {replies.map((reply) => (
                <CommentItem
                    key={reply.id}
                    comment={reply}
                    replies={[]}
                    postId={postId}
                    currentUserId={currentUserId}
                    isCoach={isCoach}
                    isReply
                />
            ))}

            {showReplyInput && (
                <div className="ml-10">
                    <CommentInput
                        postId={postId}
                        parentCommentId={comment.id}
                        placeholder={`Ответить ${comment.author.full_name}...`}
                        autoFocus
                        onSubmitted={() => setShowReplyInput(false)}
                    />
                </div>
            )}
        </div>
    )
}