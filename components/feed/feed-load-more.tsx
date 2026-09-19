'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { PostCard } from '@/components/feed/post-card'
import { loadMorePostsAction } from '@/app/(main)/feed/load-more-action'
import type { PostWithAuthor, ReactionGroup } from '@/app/(main)/feed/queries'

type Props = {
    initialCursor: string
    isCoach: boolean
}

export function FeedLoadMore({ initialCursor, isCoach }: Props) {
    const [posts, setPosts] = useState<PostWithAuthor[]>([])
    const [reactions, setReactions] = useState<Record<string, ReactionGroup[]>>({})
    const [votes, setVotes] = useState<Record<string, string[]>>({})
    const [cursor, setCursor] = useState<string | null>(initialCursor)
    const [isPending, startTransition] = useTransition()
    const sentinelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const node = sentinelRef.current
        if (!node || !cursor) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting || isPending) return

                startTransition(async () => {
                    const next = await loadMorePostsAction(cursor)
                    setPosts((prev) => [...prev, ...next.posts])
                    setReactions((prev) => ({ ...prev, ...next.reactions }))
                    setVotes((prev) => ({ ...prev, ...next.votes }))
                    setCursor(next.nextCursor)
                })
            },
            { rootMargin: '400px' }
        )

        observer.observe(node)
        return () => observer.disconnect()
    }, [cursor, isPending])

    return (
        <>
            <div className="mt-3 space-y-3">
                {posts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        isCoach={isCoach}
                        reactions={reactions[post.id] ?? []}
                        votedFor={votes[post.id] ?? []}
                    />
                ))}
            </div>

            {cursor && (
                <div ref={sentinelRef} className="py-6 text-center text-xs text-muted">
                    {isPending ? 'Загружаем…' : ''}
                </div>
            )}
        </>
    )
}