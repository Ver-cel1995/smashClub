'use client'

import {memo, useState} from 'react'
import {Bookmark, Loader2, MessageCircle, MoreHorizontal, Pin, Share2, Trash2,} from 'lucide-react'
import {toast} from 'sonner'
import {UserAvatar} from '@/components/user-avatar'
import {PostContent} from './post-content'
import {PostReactions} from './post-reactions'
import {formatRelativeTime} from '@/shared/lib/format'
import {deletePost, togglePinPost} from '@/app/(main)/feed/actions'
import type {PostWithAuthor, ReactionGroup} from '@/app/(main)/feed/queries'
import {cn} from '@/shared/lib/utils'
import {useProgressRouter} from '@/shared/hooks/use-progress-router'
import {useProgressAction} from '@/shared/hooks/use-progress-action'
import {useConfirm} from '@/shared/lib/confirm/confirm-context'
import dynamic from "next/dynamic";

type PostCardProps = {
    post: PostWithAuthor
    isCoach: boolean
    reactions?: ReactionGroup[]
    full?: boolean
    votedFor?: string[]
}

// Lazy-load для медиа и опросов
const PostMedia = dynamic(
    () => import('./post-media').then((m) => m.PostMedia),
    { ssr: true, loading: () => <div className="h-40 animate-pulse rounded-xl bg-neutral-800" /> }
)

const PostPoll = dynamic(
    () => import('./post-poll').then((m) => m.PostPoll),
    { ssr: true }
)

// Dropdown только для тренера
const DropdownMenu = dynamic(
    () => import('@/components/ui/dropdown-menu').then((m) => m.DropdownMenu),
    { ssr: false }
)
const DropdownMenuContent = dynamic(
    () => import('@/components/ui/dropdown-menu').then((m) => m.DropdownMenuContent),
    { ssr: false }
)
const DropdownMenuItem = dynamic(
    () => import('@/components/ui/dropdown-menu').then((m) => m.DropdownMenuItem),
    { ssr: false }
)
const DropdownMenuTrigger = dynamic(
    () => import('@/components/ui/dropdown-menu').then((m) => m.DropdownMenuTrigger),
    { ssr: false }
)



export const PostCard = memo(function PostCard({
                             post,
                             isCoach,
                             reactions = [],
                             full = false,
                             votedFor = [],
                         }: PostCardProps) {
    const router = useProgressRouter()
    const confirm = useConfirm()
    const [runAction, isPending] = useProgressAction()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isNavigating, setIsNavigating] = useState(false)

    const busy = isPending || isNavigating



    const handleDelete = async () => {
        const ok = await confirm({
            title: 'Удалить пост?',
            description: 'Это действие нельзя отменить.',
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            variant: 'danger',
        })
        if (!ok) return

        runAction(async () => {
            const result = await deletePost(post.id)
            if (result.success) {
                toast.success('Пост удалён')
                if (full) router.push('/feed')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    const handleTogglePin = () => {
        runAction(async () => {
            const result = await togglePinPost(post.id, !post.is_pinned)
            if (result.success) {
                toast.success(post.is_pinned ? 'Пост откреплён' : 'Пост закреплён')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    const handleCardClick = (e: React.MouseEvent) => {
        if (full || busy) return
        const target = e.target as HTMLElement
        if (target.closest('button, a, [role="menuitem"]')) return
        setIsNavigating(true)
        router.push(`/feed/${post.id}`)
    }

    const handleCommentClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (full || busy) return
        setIsNavigating(true)
        router.push(`/feed/${post.id}`)
    }

    const commentsCount = post.comments_count ?? 0

    const poll =
        post.post_type === 'poll' && post.poll_question && post.poll_options
            ? {
                question: post.poll_question,
                options: post.poll_options as Array<{
                    id: string
                    text: string
                    votes: number
                }>,
                multipleChoice: post.poll_multiple_choice ?? false,
            }
            : null

    return (
        <article
            className={cn(
                'relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900',
                !full && !busy && 'cursor-pointer transition-colors hover:border-neutral-700',
                busy && 'pointer-events-none opacity-70'
            )}
            onClick={handleCardClick}
        >
            {busy && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900/50">
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                </div>
            )}

            {post.is_pinned && (
                <div className="flex items-center gap-1.5 border-b border-accent bg-accent-muted px-4 py-2">
                    <Pin className="h-3 w-3 text-accent" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                        Закреплено
                    </span>
                </div>
            )}

            <div className="space-y-3 p-4">
                {/* Шапка */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar
                            name={post.author.full_name}
                            avatarUrl={post.author.avatar_url}
                            size="md"
                        />
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-semibold text-white">
                                    {post.author.full_name}
                                </p>
                                {post.author.role === 'coach' && (
                                    <span className="shrink-0 rounded-full border border-accent bg-accent-muted px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">
                                        Тренер
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                <span>{formatRelativeTime(post.created_at)}</span>
                                {post.edited_at && (
                                    <>
                                        <span>·</span>
                                        <span>изменено</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {isCoach && (
                        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="shrink-0 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                                    aria-label="Меню поста"
                                    disabled={busy}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="border-neutral-800 bg-neutral-900"
                            >
                                <DropdownMenuItem
                                    onClick={handleTogglePin}
                                    className="cursor-pointer text-white focus:bg-neutral-800 focus:text-white"
                                >
                                    <Pin className="mr-2 h-4 w-4" />
                                    {post.is_pinned ? 'Открепить' : 'Закрепить'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Удалить
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <PostContent
                    title={post.title}
                    content={post.content}
                    postId={post.id}
                    full={full}
                />

                {post.media_urls && post.media_urls.length > 0 && (
                    <PostMedia urls={post.media_urls} />
                )}

                {poll && (
                    <PostPoll
                        postId={post.id}
                        question={poll.question}
                        options={poll.options}
                        multipleChoice={poll.multipleChoice}
                        votedFor={votedFor}
                    />
                )}

                <PostReactions postId={post.id} reactions={reactions} />

                {!full && (
                    <div className="flex items-center gap-4 border-t border-neutral-800/50 pt-2">
                        <button
                            type="button"
                            onClick={handleCommentClick}
                            className="flex items-center gap-1.5 text-neutral-400 transition-colors hover:text-white"
                            aria-label="Комментарии"
                        >
                            <MessageCircle className="h-5 w-5" />
                            {commentsCount > 0 && (
                                <span className="text-xs font-medium">{commentsCount}</span>
                            )}
                        </button>

                        <button
                            type="button"
                            className="text-neutral-400 transition-colors hover:text-white"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Поделиться"
                        >
                            <Share2 className="h-5 w-5" />
                        </button>

                        <button
                            type="button"
                            className="ml-auto text-neutral-400 transition-colors hover:text-white"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Сохранить"
                        >
                            <Bookmark className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>
        </article>
    )
})