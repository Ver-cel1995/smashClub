import type { Profile } from '@/types'

type Props = {
    profile: Profile
}

export function ProfileStats({ profile }: Props) {
    const items = [
        { label: 'Рейтинг', value: profile.rating_overall ?? '—' },
        { label: 'Турниров', value: profile.tournaments_played ?? 0 },
        { label: 'Побед', value: profile.matches_won ?? 0 },
    ]

    return (
        <div className="grid grid-cols-3 gap-2">
            {items.map((it) => (
                <div
                    key={it.label}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3 text-center"
                >
                    <div className="text-xl font-bold text-lime-400">{it.value}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">
                        {it.label}
                    </div>
                </div>
            ))}
        </div>
    )
}