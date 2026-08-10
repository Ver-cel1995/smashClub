import { getCurrentUser } from '@/shared/lib/auth'
import { getPosts, getReactionsForPosts, getVotesForPosts } from './queries'
import { FeedTabs } from '@/components/feed/feed-tabs'

export default async function FeedPage() {
    const user = await getCurrentUser()
    if (!user) return null

    const isCoach = user.profile.role === 'coach'

    const posts = await getPosts()

    const postIds = posts.map((p) => p.id)
    const pollPostIds = posts.filter((p) => p.post_type === 'poll').map((p) => p.id)

    const [reactionsMap, votesMap] = await Promise.all([
        getReactionsForPosts(postIds, user.userId),
        getVotesForPosts(pollPostIds, user.userId),
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