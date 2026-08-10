import { PostCardSkeleton } from '@/components/home/skeletons'

export default function FeedLoading() {
    return (
        <div className="space-y-3 p-4">
            <div className="mb-4 flex gap-2">
                <div className="h-8 w-20 animate-pulse rounded-xl bg-neutral-800" />
                <div className="h-8 w-20 animate-pulse rounded-xl bg-neutral-800" />
            </div>
            {[1, 2, 3].map((i) => (
                <PostCardSkeleton key={i} />
            ))}
        </div>
    )
}