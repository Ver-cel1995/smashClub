import { ShuttleLoader } from '@/components/shared/shuttle-loader'

export default function MainLoading() {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <ShuttleLoader size={160} />
            <p className="text-sm text-neutral-500 font-semibold uppercase tracking-wider animate-pulse">
                Загрузка...
            </p>
        </div>
    )
}