import Link from 'next/link'
import Image from 'next/image'
import { Pin, MessageCircle, Heart, Image as ImageIcon } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { formatRelativeTime } from '@/shared/lib/format'
import type { Post, Profile } from '@/types'

type Props = {
    post: Post & { author: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> }
}

export function PinnedFeedCard({ post }: Props) {
    const firstImage = post.media_urls?.[0]
    const photoCount = post.media_urls?.length ?? 0

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Лента
                </span>
                <Link
                    href="/feed"
                    className="text-xs font-medium text-accent hover:underline"
                >
                    Все новости
                </Link>
            </div>

            <Link
                href={`/feed/${post.id}`}
                className="block overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] transition active:scale-[0.99]"
            >
                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <UserAvatar
                                name={post.author.full_name}
                                avatarUrl={post.author.avatar_url}
                                size="sm"
                            />
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-[var(--text-main)]">
                                        {post.author.full_name}
                                    </span>
                                    <span className="rounded-full border border-accent bg-accent-muted px-1.5 py-0.2 text-[8px] font-bold uppercase text-accent">
                                        ТРЕНЕР
                                    </span>
                                </div>
                                <span className="text-[10px] text-[var(--text-muted)]">
                                    {formatRelativeTime(post.created_at)}
                                </span>
                            </div>
                        </div>
                        {post.is_pinned && (
                            <Pin className="h-3.5 w-3.5 text-accent" />
                        )}
                    </div>

                    {post.title && (
                        <h3 className="line-clamp-2 text-sm font-bold text-[var(--text-main)]">
                            {post.title}
                        </h3>
                    )}

                    {post.content && (
                        <p className="line-clamp-2 text-xs text-[var(--text-muted)]">
                            {post.content}
                        </p>
                    )}
                </div>

                {firstImage && (
                    <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                            src={firstImage}
                            alt={post.title ?? 'Пост'}
                            fill
                            sizes="(max-width: 640px) 100vw, 500px"
                            className="object-cover"
                        />
                    </div>
                )}

                <div className="flex items-center gap-4 px-4 py-3 text-xs text-[var(--text-muted)] border-t border-[var(--border-card)]/60">
                    {photoCount > 0 && (
                        <span className="flex items-center gap-1">
                            <ImageIcon className="h-3.5 w-3.5" /> {photoCount} фото
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" /> {post.comments_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" />
                    </span>
                </div>
            </Link>
        </div>
    )
}
