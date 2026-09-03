import { getCurrentUser } from '@/shared/lib/auth'
import { getPosts, getReactionsForPosts, getVotesForPosts } from './queries'
import { FeedTabs } from '@/components/feed/feed-tabs'

export default async function FeedPage() {
    const user = await getCurrentUser()

    // Для гостя user === null, поэтому задаём безопасные значения:
    const userId = user?.id ?? null
    const isCoach = user?.profile?.role === 'coach' || user?.profile?.role === 'development'

    // Загружаем посты (они видны всем)
    const posts = await getPosts()

    const postIds = posts.map((p) => p.id)
    const pollPostIds = posts.filter((p) => p.post_type === 'poll').map((p) => p.id)

    // Загружаем реакции и голоса (для гостя userId === null)
    const [reactionsMap, votesMap] = await Promise.all([
        getReactionsForPosts(postIds, userId),
        getVotesForPosts(pollPostIds, userId),
    ])

    const reactionsObj: Record<string, any[]> = {}
    reactionsMap.forEach((v, k) => { reactionsObj[k] = v })

    const votesObj: Record<string, string[]> = {}
    votesMap.forEach((v, k) => { votesObj[k] = v })

    return (
        <FeedTabs
            posts={posts}
            reactionsMap={reactionsObj}
            votesMap={votesObj}
            isCoach={isCoach}
            galleryMonths={[]}
        />
    )
}