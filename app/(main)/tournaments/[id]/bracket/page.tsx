import { BracketBuilder } from '@/components/tournaments/bracket/bracket-builder';
import { getTournamentBracketData } from './queries';
import { getCurrentUser } from '@/shared/lib/auth';
import { redirect, notFound } from 'next/navigation';

export default async function BracketPage({
                                              params,
                                          }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const user = await getCurrentUser();
    if (!user) {
        redirect(`/login?next=/tournaments/${id}/bracket`);
    }

    const data = await getTournamentBracketData(id);

    if (!data.tournament) {
        notFound();
    }

    const isOwner = Boolean(data.tournament.created_by && user.id === data.tournament.created_by);
    const isCoachRole = user.role === 'coach' || user.role === 'development';
    const canAccess = isCoachRole || isOwner || process.env.NODE_ENV === 'development';

    if (!canAccess) {
        redirect(`/tournaments/${id}`);
    }

    return (
        <BracketBuilder
            tournamentId={id}
            initialCategories={data.categories}
            initialParticipants={data.participants}
            initialMatches={data.matches}
        />
    );
}