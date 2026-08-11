export default function ScheduleLoading() {
    return (
        <div className="space-y-4 p-4 pb-24">
            <div className="flex items-center justify-between">
                <div className="h-6 w-32 animate-pulse rounded-lg bg-neutral-800" />
            </div>
            <div className="h-64 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 animate-pulse" />
        </div>
    )
}