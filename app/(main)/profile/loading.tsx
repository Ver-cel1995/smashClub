export default function ProfileLoading() {
    return (
        <div className="space-y-4 p-4 pb-24">
            <div className="flex items-center gap-3 rounded-2xl border-strong bg-card/50 p-4">
                <div className="h-14 w-14 rounded-full bg-neutral-800 animate-pulse" />
                <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 rounded bg-neutral-800 animate-pulse" />
                    <div className="h-3 w-20 rounded bg-neutral-800 animate-pulse" />
                </div>
            </div>
            <div className="h-32 rounded-2xl border-strong bg-card/50 p-4 animate-pulse" />
        </div>
    )
}