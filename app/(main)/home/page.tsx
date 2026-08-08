import {getCurrentUser} from '@/shared/lib/auth'

export default async function HomePage() {
    const user = await getCurrentUser()
    if (!user) return null

    return (
        <div className="p-4 space-y-4">
            {/* Заглушка: закреплённое объявление */}
            <section className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📌</span>
                    <h2 className="text-sm font-semibold text-lime-400">Закреплено</h2>
                </div>
                <p className="text-sm text-neutral-300">
                    Здесь будет закреплённое объявление от тренера
                </p>
            </section>

            {/* Заглушка: ближайшая тренировка */}
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🏸</span>
                        <h2 className="text-sm font-semibold text-white">Ближайшая тренировка</h2>
                    </div>
                </div>
                <p className="text-sm text-neutral-400">
                    Сегодня, 18:00–20:00 · Спортзал ДЮСШ
                </p>
            </section>

            {/* Заглушка: последний пост */}
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📰</span>
                    <h2 className="text-sm font-semibold text-white">Из ленты</h2>
                </div>
                <p className="text-sm text-neutral-400">
                    Здесь будет превью последнего поста из ленты
                </p>
            </section>
        </div>
    )
}