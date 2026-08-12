import { getCurrentUser } from '@/shared/lib/auth'
import { getNextTournament } from '@/app/(main)/home/queries'
import { NextTournamentCard } from '@/components/home/next-tournament-card'

/**
 * Async server component для Suspense.
 * Показывает ближайший турнир (в будущем или идущий сейчас).
 * Скрывается если турниров нет.
 */
export async function NextTournamentBlock() {
    const user = await getCurrentUser()
    if (!user) return null

    const tournament = await getNextTournament(user.userId)
    if (!tournament) return null

    return <NextTournamentCard tournament={tournament} />
}