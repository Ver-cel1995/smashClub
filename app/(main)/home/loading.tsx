import { TrainingCardSkeleton, PostCardSkeleton } from '@/components/home/skeletons'

export default function HomeLoading() {
    return (
        <div className="flex flex-col gap-3 p-4 pb-24">
            <TrainingCardSkeleton />
            <PostCardSkeleton />
        </div>
    )
}