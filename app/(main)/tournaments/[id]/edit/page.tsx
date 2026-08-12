import { getCurrentUser } from '@/shared/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'
import { EditTournamentClient } from '@/components/tournaments/edit-tournament-client'

export default async function EditTournamentPage({
                                                     params,
                                                 }: {
    params: Promise<{ id: string }>
}) {
    const user = await getCurrentUser()
    if (!user) redirect('/login')
    if (user.profile.role !== 'coach') redirect('/tournaments')

    const { id } = await params
    const supabase = await createClient()

    const { data: tournament } = await supabase
        .from('tournaments')
        .select('*, categories:tournament_categories(*)')
        .eq('id', id)
        .single()

    if (!tournament) notFound()

    return <EditTournamentClient tournament={tournament} />
}