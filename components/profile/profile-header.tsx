import Link from 'next/link'
import { Edit2, MapPin } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { CITY_LABEL } from '@/shared/lib/cities'
import type { Profile } from '@/types'

type Props = {
    profile: Profile
}

export function ProfileHeader({ profile }: Props) {
    const cityLabel = profile.city ? CITY_LABEL[profile.city] ?? profile.city : null

    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
            <div className="relative">
                <UserAvatar
                    name={profile.full_name}
                    avatarUrl={profile.avatar_url}
                    size="xl"
                />
            </div>

            <div>
                <h2 className="text-lg font-bold text-white">{profile.full_name}</h2>
                {profile.role === 'coach' && (
                    <span className="rounded-full border border-accent bg-accent-muted px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                        Тренер
                    </span>
                )}
                <div className="mt-1 flex items-center justify-center gap-2 text-xs text-neutral-500">
                    {cityLabel && (
                        <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {cityLabel}
                        </span>
                    )}
                </div>
            </div>

            <Link
                href="/profile/settings"
                className="mt-1 flex items-center gap-1.5 rounded-xl border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 transition hover:bg-neutral-800"
            >
                <Edit2 className="h-3.5 w-3.5" />
                Редактировать
            </Link>
        </div>
    )
}