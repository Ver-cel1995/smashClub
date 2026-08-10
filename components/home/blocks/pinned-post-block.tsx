import { getHomeFeedPost } from '@/app/(main)/home/queries'
import { PinnedFeedCard } from '../pinned-feed-card'

export async function PinnedPostBlock() {
    const post = await getHomeFeedPost()
    if (!post) return null

    return <PinnedFeedCard post={post} />
}