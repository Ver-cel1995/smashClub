export default function FeedLoading() {
    return (
        <div className="p-4 space-y-4">
            <div className="h-8 w-24 rounded-lg bg-neutral-900 animate-pulse" />

            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 space-y-3"
                    >
                        {/* Аватар + имя */}
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-neutral-800 animate-pulse" />
                            <div className="space-y-1.5 flex-1">
                                <div className="h-3 w-32 rounded bg-neutral-800 animate-pulse" />
                                <div className="h-2.5 w-20 rounded bg-neutral-800 animate-pulse" />
                            </div>
                        </div>

                        {/* Текст */}
                        <div className="space-y-2">
                            <div className="h-3 w-full rounded bg-neutral-800 animate-pulse" />
                            <div className="h-3 w-4/5 rounded bg-neutral-800 animate-pulse" />
                            <div className="h-3 w-3/5 rounded bg-neutral-800 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}