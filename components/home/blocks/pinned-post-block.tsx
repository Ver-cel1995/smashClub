import {getHomeFeedPost} from '@/app/(main)/home/queries'
import {PinnedFeedCard} from '../pinned-feed-card'

export async function PinnedPostBlock() {
    const post = await getHomeFeedPost()
    if (!post) return null

    return (
        <div data-tour="home-pinned-post">
            <PinnedFeedCard post={post}/>
        </div>
    )
}