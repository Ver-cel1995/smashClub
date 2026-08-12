import Link from 'next/link'
import { Trophy, ChevronRight, MapPin, Calendar } from 'lucide-react'
import { formatDayMonth } from '@/shared/lib/format'

type Tournament = {
    id: string
    title: string
    start_date: string
    end_date: string | null
    tournament_type: string
    location: string | null
}

type Props = {
    tournaments: Tournament[]
}

export function ProfileTournamentsCard({ tournaments }: Props) {
    return (
        <div className="rounded-2xl border border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase text-neutral-500">
                <Trophy className="h-3.5 w-3.5" />
                Ближайшие турниры
            </div>

            <ul className="space-y-2">
                {tournaments.map((t) => (
                    <li key={t.id}>
                        <Link
                            href={`/tournaments/${t.id}`}
                            className="flex items-center gap-3 rounded-xl border border bg-neutral-950 p-3 transition hover:border-neutral-700"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-white">
                                    {t.title}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                                    <Calendar className="h-3 w-3" />
                                    {formatDayMonth(t.start_date)}
                                    {t.location && (
                                        <>
                                            <MapPin className="h-3 w-3" />
                                            {t.location}
                                        </>
                                    )}
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-500" />
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}