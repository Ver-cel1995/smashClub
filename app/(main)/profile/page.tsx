import { getCurrentUser } from '@/shared/lib/auth'
import { UserAvatar } from '@/components/user-avatar'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'

export default async function ProfilePage() {
    const user = await getCurrentUser()
    if (!user) return null

    const { profile } = user

    return (
        <div className="p-4 space-y-4">
            {/* Шапка профиля */}
            <section className="flex flex-col items-center text-center py-6">
                <UserAvatar
                    name={profile.full_name}
                    avatarUrl={profile.avatar_url}
                    size="xl"
                />
                <h1 className="mt-4 text-2xl font-bold text-white">
                    {profile.full_name}
                </h1>
                {profile.age_group && (
                    <p className="text-sm text-neutral-400">{profile.age_group}</p>
                )}
            </section>

            {/* Статистика */}
            <section className="grid grid-cols-3 gap-3">
                <StatCard label="Рейтинг" value={profile.rating_overall} />
                <StatCard label="Турниров" value={profile.tournaments_played} />
                <StatCard label="Побед" value={profile.matches_won} />
            </section>

            {/* Заглушки будущих секций */}
            <SectionPlaceholder icon="💰" title="К оплате" />
            <SectionPlaceholder icon="🎾" title="Мои ракетки" />
            <SectionPlaceholder icon="🏆" title="Ближайшие турниры" />
            <SectionPlaceholder icon="🏅" title="Достижения" />

            {/* Выход */}
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

function StatCard({ label, value }: { label: string; value: number | null }) {
    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3 text-center">
            <p className="text-xl font-bold text-lime-400">{value}</p>
            <p className="mt-1 text-[11px] text-neutral-500 uppercase tracking-wider">
                {label}
            </p>
        </div>
    )
}

function SectionPlaceholder({ icon, title }: { icon: string; title: string }) {
    return (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <h2 className="text-sm font-semibold text-white">{title}</h2>
            </div>
            <p className="mt-2 text-xs text-neutral-500">Скоро будет доступно</p>
        </section>
    )
}