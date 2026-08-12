// src/app/(main)/tournaments/new/page.tsx
import { getCurrentUser } from '@/shared/lib/auth'
import { redirect } from 'next/navigation'
import { NewTournamentClient } from '@/components/tournaments/new-tournament-client'

export default async function NewTournamentPage() {
    const user = await getCurrentUser()
    if (!user) redirect('/login')
    if (user.profile.role !== 'coach') redirect('/tournaments')

    return <NewTournamentClient />
}