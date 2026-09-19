import Link from 'next/link'
import { cn } from '@/shared/lib/utils'

export type TournamentTabId = 'overview' | 'participants' | 'brackets'

const TABS: { id: TournamentTabId; label: string }[] = [
    { id: 'overview', label: 'Обзор' },
    { id: 'participants', label: 'Участники' },
    { id: 'brackets', label: 'Сетки' },
]

export function TournamentTabs({
                                   tournamentId,
                                   active,
                               }: {
    tournamentId: string
    active: TournamentTabId
}) {
    return (
        <div className="flex px-4 gap-6 overflow-x-auto scrollbar-hide pt-3">
            {TABS.map((tab) => (
                <Link
                    key={tab.id}
                    href={
                        tab.id === 'overview'
                            ? `/tournaments/${tournamentId}`
                            : `/tournaments/${tournamentId}?tab=${tab.id}`
                    }
                    scroll={false}
                    prefetch
                    className={cn(
                        'pb-3 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2',
                        active === tab.id
                            ? 'text-accent border-accent'
                            : 'text-muted border-transparent hover:text-main'
                    )}
                >
                    {tab.label}
                </Link>
            ))}
        </div>
    )
}