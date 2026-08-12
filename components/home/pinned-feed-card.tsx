import Link from 'next/link'
import Image from 'next/image'
import { Pin } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { formatRelativeTime } from '@/shared/lib/format'
import type { Post, Profile } from '@/types'

type Props = {
    post: Post & { author: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> }
}

export function PinnedFeedCard({ post }: Props) {
    const firstImage = post.media_urls?.[0]

    return (
        <div>
            <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-medium uppercase text-muted-foreground">
          Лента
        </span>
                <Link
                    href="/feed"
                    className="text-xs text-primary hover:underline"
                >
                    Все новости
                </Link>
            </div>

            <Link
                href={`/feed/${post.id}`}
                className="block overflow-hidden rounded-2xl border border-border bg-card transition active:scale-[0.99]"
            >
                {firstImage && (
                    <div className="relative aspect-video w-full">
                        <Image
                            src={firstImage}
                            alt={post.title ?? 'Пост'}
                            fill
                            sizes="(max-width: 640px) 100vw, 500px"
                            className="object-cover"
                        />
                    </div>
                )}

                <div className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                        <UserAvatar
                            name={post.author.full_name}
                            avatarUrl={post.author.avatar_url}
                            size="sm"
                        />
                        <span className="text-xs font-medium">{post.author.full_name}</span>
                        <span className="text-xs text-muted-foreground">
              {formatRelativeTime(post.created_at)}
            </span>
                        {post.is_pinned && (
                            <Pin className="ml-auto h-3.5 w-3.5 text-primary" />
                        )}
                    </div>

                    {post.title && (
                        <h3 className="mb-1 line-clamp-2 text-sm font-semibold">
                            {post.title}
                        </h3>
                    )}
                    {post.content && (
                        <p className="line-clamp-3 text-xs text-foreground/80">
                            {post.content}
                        </p>
                    )}
                </div>
            </Link>
        </div>
    )
}