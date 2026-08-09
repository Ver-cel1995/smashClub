import { getCurrentUser } from '@/shared/lib/auth'
import { getNextTraining } from '@/app/(main)/schedule/queries'
import { NextTrainingCard } from '@/components/home/next-training-card'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
    const user = await getCurrentUser()
    if (!user) return null

    const nextTraining = await getNextTraining(user.userId)

    return (
        <div className="p-4 space-y-4">
            {/* Ближайшая тренировка */}
            {nextTraining ? (
                <NextTrainingCard training={nextTraining} />
            ) : (
                <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                    <p className="text-sm text-neutral-500">Нет предстоящих тренировок</p>
                </section>
            )}

            {/* Заглушка ленты */}
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📰</span>
                    <h2 className="text-sm font-semibold text-white">Из ленты</h2>
                </div>
                <p className="text-sm text-neutral-400">
                    Последние посты появятся здесь
                </p>
            </section>

            <details className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                <summary className="text-xs text-neutral-500 cursor-pointer">Debug</summary>
                <div className="mt-2 space-y-1 text-xs text-neutral-500 font-mono">
                    <p>Role: {user.profile.role}</p>
                    <p>ID: {user.userId}</p>
                </div>
            </details>

            <form action={signOut}>
                <Button
                    type="submit"
                    variant="primary"
                    className="w-full border-neutral-800 text-neutral-300 hover:bg-neutral-900"
                >
                    Выйти
                </Button>
            </form>
        </div>
    )
}