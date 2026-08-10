export function TrainingCardSkeleton() {
    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-3 h-6 w-40 animate-pulse rounded bg-neutral-800" />
            <div className="mb-2 h-4 w-32 animate-pulse rounded bg-neutral-800" />
            <div className="mb-4 h-3 w-24 animate-pulse rounded bg-neutral-800" />
            <div className="flex gap-2">
                <div className="h-9 flex-1 animate-pulse rounded-xl bg-neutral-800" />
                <div className="h-9 flex-1 animate-pulse rounded-xl bg-neutral-800" />
            </div>
        </div>
    )
}

export function PostCardSkeleton() {
    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-3 flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-neutral-800" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-neutral-800" />
                    <div className="h-2 w-16 animate-pulse rounded bg-neutral-800" />
                </div>
            </div>
            <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
            <div className="h-3 w-full animate-pulse rounded bg-neutral-800" />
        </div>
    )
}