import { EmptyState } from '@/components/shared/empty-state'

export function ProfileAchievements() {
    // Позже подтянем из БД (player_achievements)
    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase text-neutral-500">
                <span>⭐</span>
                Достижения
            </div>

            <EmptyState
                icon="🏆"
                title="Пока пусто"
                description="Играй активнее — открывай ачивки"
                compact
            />
        </div>
    )
}