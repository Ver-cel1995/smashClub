
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/shared/lib/auth';
import { createClient } from '@/shared/lib/supabase/server';
import {EditTournamentClient} from "@/components/tournaments/edit-tournament-client";

export const dynamic = 'force-dynamic';

export default async function EditTournamentPage({params}: {params: Promise<{ id: string }>}) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const supabase = await createClient();

    const { data: tournament } = await supabase
        .from('tournaments')
        .select(
            `id, title, location, venue, start_date, end_date, description,
             registration_deadline, entry_fee_amount, has_entry_fee,
             pdf_url, pdf_storage_path, created_by, status,
             tournament_type, max_participants, participants_count,
             created_at, updated_at`
        )
        .eq('id', id)
        .maybeSingle();

    if (!tournament) notFound();

    const { data: categories } = await supabase
        .from('tournament_categories')
        .select('id, category, age_group, rating_group')
        .eq('tournament_id', id);

    const isOwner = user.id === tournament.created_by;
    const canManage =
        user.profile.role === 'coach' || user.profile.role === 'development' || isOwner;

    if (!canManage) redirect(`/tournaments/${id}`);

    const tournamentWithCategories = {...tournament, categories: categories ?? []};

    return (
        <div className="min-h-screen bg-app max-w-2xl mx-auto pb-20">
            <EditTournamentClient tournament={tournamentWithCategories as never} />
        </div>
    );
}