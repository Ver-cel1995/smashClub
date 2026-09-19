import { Suspense } from 'react'
import { getCurrentUser } from '@/shared/lib/auth'
import { getFeedPage, getReactionsForPosts, getVotesForPosts } from './queries'
import { FeedTabsNav } from '@/components/feed/feed-tabs-nav'
import { PostCard } from '@/components/feed/post-card'
import { CreatePostFab } from '@/components/feed/create-post-fab'
import { EmptyState } from '@/components/shared/empty-state'
import { FeedLoadMore } from '@/components/feed/feed-load-more'
import { GalleryTab } from '@/components/feed/gallery-tab'
import { PostCardSkeleton } from '@/components/home/skeletons'

type Props = {
    searchParams: Promise<{ tab?: string }>
}

export default async function FeedPage({ searchParams }: Props) {
    const { tab } = await searchParams
    const activeTab = tab === 'gallery' ? 'gallery' : 'feed'

    const user = await getCurrentUser()
    const userId = user?.id ?? null
    const isCoach = user?.profile?.role === 'coach' || user?.profile?.role === 'development'

    return (
        <div className="flex flex-col">
            <FeedTabsNav active={activeTab} />

            <div className="p-4" data-tour="feed-list">
                {activeTab === 'gallery' ? (
                    <Suspense fallback={<PostCardSkeleton />}>
                        <GalleryTab />
                    </Suspense>
                ) : (
                    <Suspense fallback={<PostCardSkeleton />}>
                        <FeedList userId={userId} isCoach={isCoach} />
                    </Suspense>
                )}
            </div>
        </div>
    )
}

async function FeedList({ userId, isCoach }: { userId: string | null; isCoach: boolean }) {
    const { posts, nextCursor } = await getFeedPage({ limit: 20 })

    if (posts.length === 0) {
        return (
            <EmptyState
                icon="📰"
                title="Пока пусто"
                description={
                    isCoach
                        ? 'Напиши первый пост — расскажи о ближайших планах'
                        : 'Скоро здесь появятся новости от тренера'
                }
            />
        )
    }

    const postIds = posts.map((p) => p.id)
    const pollPostIds = posts.filter((p) => p.post_type === 'poll').map((p) => p.id)

    const [reactionsMap, votesMap] = await Promise.all([
        getReactionsForPosts(postIds, userId),
        getVotesForPosts(pollPostIds, userId),
    ])

    return (
        <>
            <div className="space-y-3 cv-auto">
                {posts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        isCoach={isCoach}
                        reactions={reactionsMap[post.id] ?? []}
                        votedFor={votesMap[post.id] ?? []}
                    />
                ))}
            </div>

            {nextCursor && <FeedLoadMore initialCursor={nextCursor} isCoach={isCoach} />}

            {isCoach && <CreatePostFab />}
        </>
    )
}