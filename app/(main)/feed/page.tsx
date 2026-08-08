import { getCurrentUser } from '@/shared/lib/auth'
import { getPosts } from './queries'
import { PostCard } from '@/components/feed/post-card'
import { CreatePostFab } from '@/components/feed/create-post-fab'
import { EmptyState } from '@/components/shared/empty-state'

export default async function FeedPage() {
    const user = await getCurrentUser()
    if (!user) return null

    const posts = await getPosts()
    const isCoach = user.profile.role === 'coach'

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
                        <PostCard key={post.id} post={post} isCoach={isCoach} />
                    ))}
                </div>
            )}

            {isCoach && <CreatePostFab />}
        </div>
    )
}