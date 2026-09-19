'use server'

import { getCurrentUser } from '@/shared/lib/auth'
import { getFeedPage, getReactionsForPosts, getVotesForPosts } from './queries'
import type { PostWithAuthor, ReactionGroup } from './queries'

export type LoadMoreResult = {
    posts: PostWithAuthor[]
    reactions: Record<string, ReactionGroup[]>
    votes: Record<string, string[]>
    nextCursor: string | null
}

export async function loadMorePostsAction(cursor: string): Promise<LoadMoreResult> {
    const user = await getCurrentUser()
    const userId = user?.id ?? null

    const { posts, nextCursor } = await getFeedPage({ cursor, limit: 20 })

    const postIds = posts.map((p) => p.id)
    const pollPostIds = posts.filter((p) => p.post_type === 'poll').map((p) => p.id)

    const [reactions, votes] = await Promise.all([
        getReactionsForPosts(postIds, userId),
        getVotesForPosts(pollPostIds, userId),
    ])

    return { posts, reactions, votes, nextCursor }
}