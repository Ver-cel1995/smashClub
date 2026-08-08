import { getCurrentUser } from '@/shared/lib/auth'
import { getPosts, getReactionsForPosts, getVotesForPosts } from './queries'
import { PostCard } from '@/components/feed/post-card'
import { CreatePostFab } from '@/components/feed/create-post-fab'
import { EmptyState } from '@/components/shared/empty-state'

export default async function FeedPage() {
    const user = await getCurrentUser()
    if (!user) return null

    const posts = await getPosts()
    const isCoach = user.profile.role === 'coach'

    const postIds = posts.map((p) => p.id)
    const pollPostIds = posts.filter((p) => p.post_type === 'poll').map((p) => p.id)

    const [reactionsMap, votesMap] = await Promise.all([
        getReactionsForPosts(postIds, user.userId),
        getVotesForPosts(pollPostIds, user.userId),
    ])

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold text-white">Лента</h1>

            {posts.length === 0 ? (
                <EmptyState
                    icon="📰"
                    title="Пока пусто"
                    description={
                        isCoach
                            ? 'Напиши первый пост — расскажи о ближайших планах'
                            : 'Скоро здесь появятся новости от тренера'
                    }
                />
            ) : (
                <div className="space-y-3">
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            isCoach={isCoach}
                            reactions={reactionsMap.get(post.id) || []}
                            votedFor={votesMap.get(post.id) || []}
                        />
                    ))}
                </div>
            )}

            {isCoach && <CreatePostFab />}
        </div>
    )
}