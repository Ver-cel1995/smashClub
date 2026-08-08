'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { MoreHorizontal, Pin, Trash2, MessageCircle, Share2, Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/user-avatar'
import { PostContent } from './post-content'
import { PostPoll } from './post-poll'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeTime, commentWord } from '@/shared/lib/format'
import { deletePost, togglePinPost } from '@/app/(main)/feed/actions'
import type { PostWithAuthor } from '@/app/(main)/feed/queries'
import { cn } from '@/shared/lib/utils'

interface PostCardProps {
    post: PostWithAuthor
    isCoach: boolean
    /** true = детальная страница, false = превью в ленте */
    full?: boolean
}

export function PostCard({ post, isCoach, full = false }: PostCardProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const handleDelete = () => {
        if (!confirm('Удалить пост?')) return

        startTransition(async () => {
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
        startTransition(async () => {
            const result = await togglePinPost(post.id, !post.is_pinned)
            if (result.success) {
                toast.success(post.is_pinned ? 'Пост откреплён' : 'Пост закреплён')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    // Клик по карточке ведёт на детальную (только в режиме превью)
    const handleCardClick = (e: React.MouseEvent) => {
        if (full) return
        // Не переходим если клик по кнопке/меню/ссылке
        const target = e.target as HTMLElement
        if (target.closest('button, a, [role="menuitem"]')) return
        router.push(`/feed/${post.id}`)
    }

    // Опрос — парсим из jsonb
    const poll = post.post_type === 'poll' && post.poll_question && post.poll_options
        ? {
            question: post.poll_question,
            options: post.poll_options as Array<{ id: string; text: string; votes: number }>,
            multipleChoice: post.poll_multiple_choice ?? false,
        }
        : null

    return (
        <article
            className={cn(
                'rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden',
                !full && 'cursor-pointer hover:border-neutral-700 transition-colors'
            )}
            onClick={handleCardClick}
        >
            {/* Пометка "закреплено" */}
            {post.is_pinned && (
                <div className="flex items-center gap-1.5 border-b border-lime-400/20 bg-lime-400/5 px-4 py-2">
                    <Pin className="h-3 w-3 text-lime-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-lime-400">
            Закреплено
          </span>
                </div>
            )}

            <div className="p-4 space-y-3">
                {/* Шапка */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                            name={post.author.full_name}
                            avatarUrl={post.author.avatar_url}
                            size="md"
                        />
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-white truncate">
                                    {post.author.full_name}
                                </p>
                                {post.author.role === 'coach' && (
                                    <span className="shrink-0 rounded-full border border-lime-400/30 bg-lime-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-lime-400">
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
                                    className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors shrink-0"
                                    aria-label="Меню поста"
                                    disabled={isPending}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="bg-neutral-900 border-neutral-800"
                            >
                                <DropdownMenuItem
                                    onClick={handleTogglePin}
                                    className="text-white cursor-pointer focus:bg-neutral-800 focus:text-white"
                                >
                                    <Pin className="h-4 w-4 mr-2" />
                                    {post.is_pinned ? 'Открепить' : 'Закрепить'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Удалить
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Контент (текст + заголовок) */}
                <PostContent title={post.title} content={post.content} full={full} />

                {/* Медиа (фото) — заглушка, реализуем ниже */}
                {post.media_urls && post.media_urls.length > 0 && (
                    <PostMediaPreview urls={post.media_urls} full={full} />
                )}

                {/* Опрос */}
                {poll && (
                    <PostPoll
                        question={poll.question}
                        options={poll.options}
                        multipleChoice={poll.multipleChoice}
                    />
                )}

                {/* Реакции (заглушка — сделаем в следующем этапе) */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                    {post.reactions_count > 0 && (
                        <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs text-neutral-300 hover:border-neutral-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span>❤️</span>
                            <span className="font-medium">{post.reactions_count}</span>
                        </button>
                    )}
                    <button
                        type="button"
                        className="flex items-center gap-1 rounded-full border border-dashed border-neutral-700 px-2.5 py-1 text-xs text-neutral-400 hover:border-neutral-600 hover:text-neutral-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="text-sm">+</span>
                        <span>реакция</span>
                    </button>
                </div>

                {/* Превью комментариев (только в превью-режиме) */}
                {!full && post.comments_count > 0 && (
                    <Link
                        href={`/feed/${post.id}`}
                        className="block text-sm text-lime-400 hover:text-lime-300 font-medium"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Показать все {post.comments_count} {commentWord(post.comments_count)}
                    </Link>
                )}

                {/* Нижняя панель с иконками (только в превью) */}
                {!full && (
                    <div className="flex items-center gap-4 pt-2 border-t border-neutral-800/50">
                        <Link
                            href={`/feed/${post.id}`}
                            className="text-neutral-400 hover:text-white transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Комментарии"
                        >
                            <MessageCircle className="h-5 w-5" />
                        </Link>
                        <button
                            type="button"
                            className="text-neutral-400 hover:text-white transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Поделиться"
                        >
                            <Share2 className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            className="ml-auto text-neutral-400 hover:text-white transition-colors"
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
}

// Заглушка для медиа — реализуем ниже
function PostMediaPreview({ urls, full }: { urls: string[]; full: boolean }) {
    return (
        <div className="rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
            <div className="aspect-video flex items-center justify-center text-neutral-500 text-xs">
                📷 {urls.length} фото (реализация в следующем шаге)
            </div>
        </div>
    )
}