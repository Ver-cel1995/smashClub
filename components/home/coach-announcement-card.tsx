import Link from 'next/link'
import { Megaphone } from 'lucide-react'
import { formatRelativeTime } from '@/shared/lib/format'
import type { Post, Profile } from '@/types'

type Props = {
    post: Post & { author: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> }
}

export function CoachAnnouncementCard({ post }: Props) {
    return (
        <Link
            href={`/feed/${post.id}`}
            className="block rounded-2xl border border-primary/30 bg-primary/5 p-4 transition active:scale-[0.99]"
        >
            <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <Megaphone className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-primary">От тренера</span>
                    <span className="text-[10px] text-muted-foreground">
            {post.author.full_name} • {formatRelativeTime(post.created_at)}
          </span>
                </div>
            </div>

            {post.title && (
                <h3 className="mb-1 text-sm font-semibold">{post.title}</h3>
            )}
            {post.content && (
                <p className="line-clamp-3 text-sm text-foreground/80">
                    {post.content}
                </p>
            )}
        </Link>
    )
}