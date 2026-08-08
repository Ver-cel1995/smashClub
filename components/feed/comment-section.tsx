'use client'

import { useState, useTransition } from 'react'
import {Trash2, Reply, Send, Loader2} from 'lucide-react'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/shared/lib/format'
import { addComment, deleteComment } from '@/app/(main)/feed/actions'
import { cn } from '@/shared/lib/utils'
import type { CommentWithAuthor } from '@/app/(main)/feed/queries'

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
    // Группируем: корневые + ответы
    const rootComments = comments.filter((c) => !c.parent_comment_id)
    const replies = comments.filter((c) => c.parent_comment_id)

    const getReplies = (commentId: string) =>
        replies.filter((r) => r.parent_comment_id === commentId)

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">
                Комментарии ({comments.length})
            </h3>

            {/* Список комментариев */}
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

            {/* Форма нового комментария */}
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
    const [isPending, startTransition] = useTransition()

    const canDelete =
        comment.author_id === currentUserId ||
        (comment.author?.id === currentUserId) ||
        isCoach

    const handleDelete = () => {
        if (!confirm('Удалить комментарий?')) return

        startTransition(async () => {
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
                />

                <div className="flex-1 min-w-0">
                    <div className="rounded-2xl bg-neutral-800/50 px-3 py-2">
                        <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold text-white truncate">
                {comment.author.full_name}
              </span>
                            {comment.author.role === 'coach' && (
                                <span className="shrink-0 rounded-full border border-lime-400/30 bg-lime-400/10 px-1 py-0.5 text-[8px] font-bold uppercase text-lime-400">
                  Тренер
                </span>
                            )}
                        </div>
                        <p className="text-sm text-neutral-200 whitespace-pre-wrap break-words">
                            {comment.content}
                        </p>
                    </div>

                    {/* Мета */}
                    <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-[11px] text-neutral-500">
              {formatRelativeTime(comment.created_at)}
            </span>

                        {!isReply && (
                            <button
                                type="button"
                                onClick={() => setShowReplyInput(!showReplyInput)}
                                className="text-[11px] text-neutral-400 hover:text-lime-400 font-medium transition-colors"
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
                                    'text-[11px] text-neutral-500 hover:text-red-400 transition-colors',
                                    'disabled:opacity-40 disabled:pointer-events-none'
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

            {/* Ответы */}
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

            {/* Форма ответа */}
            {showReplyInput && (
                <div className="ml-10">
                    <CommentInput
                        postId={postId}
                        parentCommentId={comment.id}
                        onSubmitted={() => setShowReplyInput(false)}
                        placeholder={`Ответить ${comment.author.full_name}...`}
                        autoFocus
                    />
                </div>
            )}
        </div>
    )
}

function CommentInput({
                          postId,
                          parentCommentId,
                          onSubmitted,
                          placeholder = 'Написать комментарий...',
                          autoFocus = false,
                      }: {
    postId: string
    parentCommentId?: string
    onSubmitted?: () => void
    placeholder?: string
    autoFocus?: boolean
}) {
    const [text, setText] = useState('')
    const [isPending, startTransition] = useTransition()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!text.trim() || isPending) return

        startTransition(async () => {
            const result = await addComment(postId, text, parentCommentId)

            if (result.success) {
                setText('')
                onSubmitted?.()
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={isPending}
          autoFocus={autoFocus}
          rows={1}
          className={cn(
              'flex-1 resize-none rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white',
              'placeholder:text-neutral-500',
              'focus:outline-none focus:border-lime-400/60 focus:ring-1 focus:ring-lime-400/20',
              'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 120) + 'px'
          }}
          onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
              }
          }}
      />

            <Button
                type="submit"
                disabled={isPending || !text.trim()}
                className={cn(
                    'h-10 w-10 shrink-0 rounded-full bg-lime-400 hover:bg-lime-500 text-neutral-950',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
            </Button>
        </form>
    )
}