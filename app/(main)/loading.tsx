import {PostCardSkeleton} from "@/components/home/skeletons";


export default function MainLoading() {
    return (
        <div className="space-y-4 p-4 pb-24">
            <div className="flex items-center justify-between">
                <div className="h-6 w-32 animate-pulse rounded-lg bg-neutral-800" />
                <div className="h-8 w-20 animate-pulse rounded-lg bg-neutral-800" />
            </div>
            <PostCardSkeleton />
            <PostCardSkeleton />
        </div>
    )
}